import { useState } from "react";
import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";
// theme via CSS variables; no ThemeProvider

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
            if (typeof item !== 'object' || item === null) return `Item ${i + 1}: Must be an object`;
            if (!item.hasOwnProperty('date')) return `Item ${i + 1}: Missing 'date' field`;
            if (!item.hasOwnProperty('time')) return `Item ${i + 1}: Missing 'time' field`;
            if (!item.hasOwnProperty('stars')) return `Item ${i + 1}: Missing 'stars' field`;
            if (!item.hasOwnProperty('sessions')) return `Item ${i + 1}: Missing 'sessions' field`;
            if (typeof item.date !== 'string') return `Item ${i + 1}: 'date' must be a string`;
            if (typeof item.time !== 'number') return `Item ${i + 1}: 'time' must be a number`;
            if (typeof item.stars !== 'number') return `Item ${i + 1}: 'stars' must be a number`;
            if (!Array.isArray(item.sessions)) return `Item ${i + 1}: 'sessions' must be an array`;
            const dateRegex = /^\d{2}\/\d{2}$/;
            if (!dateRegex.test(item.date)) return `Item ${i + 1}: 'date' must be in format "DD/MM" (e.g., "23/05")`;
        }
        return null;
    };

    const sortByDate = (dataArray) => {
        return dataArray.sort((a, b) => {
            const [dayA, monthA] = a.date.split('/').map(Number);
            const [dayB, monthB] = b.date.split('/').map(Number);
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
        });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            setMessage("Please select a .json file");
            setMessageType("error");
            return;
        }
        setIsUploading(true);
        setMessage("");
        try {
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
            const validationError = validateDataStructure(importedData);
            if (validationError) {
                setMessage(`Validation error: ${validationError}`);
                setMessageType("error");
                setIsUploading(false);
                return;
            }
            const existingData = await window.electron.invoke("get-logger-data");
            let loggerData = Array.isArray(existingData) ? existingData : [];
            const mergedData = [...loggerData, ...importedData];
            const sortedData = sortByDate(mergedData);
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
            event.target.value = '';
        } catch (error) {
            console.error('Import error:', error);
            setMessage("An error occurred while importing the file");
            setMessageType("error");
        }
        setIsUploading(false);
    };

    return (
        <main className={`w-screen h-screen flex flex-col items-center justify-center transition-colors duration-300 bg-secondary`}>
            <TitleBar />
            <div className="w-full flex justify-center items-center p-10 flex-col">
                <h2 className={`text-primary`}>Data can be imported using a <b>.JSON</b> with the following data structure:</h2>
                <div className={`bg-primary-weak w-full rounded-2xl p-3 mt-10 -ml-2 flex flex-row justify-between items-end`}>
                    <p className="text-primary text-sm">
                        "date" : "23/05",<br/>
                        "time" : 158,<br/>
                        "stars" : 2,<br/>
                        "sessions" : []<br/>
                    </p>
                    <p className="text-primary text-xs">data.json</p>
                </div>
                <p className={`text-sm mb-6 text-primary`}>Attempting to import data in the wrong format will result in an error.</p>
                {/* File Upload Section */}
                <div className="w-full max-w-md">
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 text-primary`}>
                            Select JSON file to import:
                        </label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className={`w-full px-3 py-2 border rounded-lg bg-primary-weak file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 border-primary text-primary file:bg-primary file:text-secondary hover:file:opacity-90 disabled:opacity-50`}
                        />
                    </div>
                </div>
                <button
                    onClick={()=> navigate("/advanced")}
                    className={`absolute top-130 right-10 w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer bg-primary text-secondary font-semibold hover:opacity-90 hover:w-45`}
                >
                    Go back
                </button>
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