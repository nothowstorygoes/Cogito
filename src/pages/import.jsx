import { useState } from "react";
import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";

 

export default function Import() {
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "error"

    const validateDataStructure = (data) => {
        if (!Array.isArray(data)) {
            return "File must contain an array of objects";
        }

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            
            // Check if it's an object
            if (typeof item !== 'object' || item === null) {
                return `Item ${i + 1}: Must be an object`;
            }

            // Check required fields
            if (!item.hasOwnProperty('date')) {
                return `Item ${i + 1}: Missing 'date' field`;
            }
            if (!item.hasOwnProperty('time')) {
                return `Item ${i + 1}: Missing 'time' field`;
            }
            if (!item.hasOwnProperty('stars')) {
                return `Item ${i + 1}: Missing 'stars' field`;
            }
            if (!item.hasOwnProperty('sessions')) {
                return `Item ${i + 1}: Missing 'sessions' field`;
            }

            // Validate data types
            if (typeof item.date !== 'string') {
                return `Item ${i + 1}: 'date' must be a string`;
            }
            if (typeof item.time !== 'number') {
                return `Item ${i + 1}: 'time' must be a number`;
            }
            if (typeof item.stars !== 'number') {
                return `Item ${i + 1}: 'stars' must be a number`;
            }
            if (!Array.isArray(item.sessions)) {
                return `Item ${i + 1}: 'sessions' must be an array`;
            }

            // Validate date format (should be like "23/05")
            const dateRegex = /^\d{2}\/\d{2}$/;
            if (!dateRegex.test(item.date)) {
                return `Item ${i + 1}: 'date' must be in format "DD/MM" (e.g., "23/05")`;
            }
        }

        return null; // No errors
    };

    const sortByDate = (dataArray) => {
        return dataArray.sort((a, b) => {
            // Convert date from "DD/MM" to comparable format
            const [dayA, monthA] = a.date.split('/').map(Number);
            const [dayB, monthB] = b.date.split('/').map(Number);
            
            // Compare by month first, then by day
            if (monthA !== monthB) {
                return monthA - monthB;
            }
            return dayA - dayB;
        });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check if it's a JSON file
        if (!file.name.endsWith('.json')) {
            setMessage("Please select a .json file");
            setMessageType("error");
            return;
        }

        setIsUploading(true);
        setMessage("");

        try {
            // Read file content
            const fileContent = await file.text();
            let importedData;

            try {
                importedData = JSON.parse(fileContent);
            } catch (parseError) {
                setMessage("Invalid JSON format");
                setMessageType("error");
                setIsUploading(false);
                return;
            }

            // Validate data structure
            const validationError = validateDataStructure(importedData);
            if (validationError) {
                setMessage(`Validation error: ${validationError}`);
                setMessageType("error");
                setIsUploading(false);
                return;
            }

            // Read existing logger data
            const existingData = await window.electron.invoke("get-logger-data");
            let loggerData = Array.isArray(existingData) ? existingData : [];

            // Merge imported data with existing data
            const mergedData = [...loggerData, ...importedData];

            // Sort by date
            const sortedData = sortByDate(mergedData);

            // Save to file
            await window.electron.invoke("set-logger-data", sortedData);

            const onboardingData = await window.electron.invoke("get-onboarding-data");
            let onboarding = onboardingData || {};
            onboarding.grandTotal=0;
            onboarding.average=0;
            onboarding.allStars=0;
            onboarding.goalReached=0;
            for(let i=0; i<sortedData.length; i++){
                onboarding.grandTotal += sortedData[i].time;
                onboarding.allStars += sortedData[i].stars;
                if(sortedData[i].stars >= 3) onboarding.goalReached++;
            }
            if(sortedData.length > 0) onboarding.average = onboarding.grandTotal / sortedData.length;
            await window.electron.invoke("set-onboarding-data", onboarding);


            setMessage(`Successfully imported ${importedData.length} entries!`);
            setMessageType("success");

            // Clear file input
            event.target.value = '';

        } catch (error) {
            console.error('Import error:', error);
            setMessage("An error occurred while importing the file");
            setMessageType("error");
        }

        setIsUploading(false);
    };

    return (
        <main className="w-screen h-screen bg-[#D2D6EF] flex flex-col items-center justify-center">
            <TitleBar />
            <div className="w-full flex justify-center items-center p-10 flex-col">
                <h2 className="text-[#6331c9]">Data can be imported using a <b>.JSON</b> with the following data structure:</h2>
                
                <div className="bg-[#767676] w-full rounded-2xl p-3 mt-10 -ml-2 flex flex-row justify-between items-end">
                    <p className="text-white text-sm">
                        "date" : "23/05",<br/>
                        "time" : 158,<br/>
                        "stars" : 2,<br/>
                        "sessions" : []<br/>
                    </p>
                    <p className="text-white text-xs">data.json</p>
                </div>
                
                <p className="text-sm text-[#6331c9] mb-6">Attempting to import data in the wrong format will result in an error.</p>
                
                {/* File Upload Section */}
                <div className="w-full max-w-md">
                    <div className="mb-4">
                        <label className="block text-[#6331c9] text-sm font-medium mb-2">
                            Select JSON file to import:
                        </label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="w-full px-3 py-2 border border-[#6331c9] rounded-lg bg-white text-[#6331c9] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#6331c9] file:text-white hover:file:bg-[#5028a3] disabled:opacity-50"
                        />
                    </div>
                </div>
                <button onClick={()=> navigate("/home")} className="bg-[#6331c9] w-30 text-white rounded-2xl h-10 absolute top-130 right-10 hover:w-45 transition-all duration-300 cursor-pointer">Go back</button>

                {/* Status Message */}
                {message && (
                    <div className={`mt-4 p-3 rounded-lg w-full max-w-md text-center ${
                        messageType === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                        {message}
                    </div>
                )}
            </div>
        </main>
    );
}