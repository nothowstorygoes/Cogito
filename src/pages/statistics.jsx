import TitleBar from "../components/TitleBar";
import { useEffect, useState } from "react";
 
import Star from "../components/star";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

export default function Statistics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [page, setPage] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await window.electron.invoke("get-logger-data");
                setData(stats);
            } catch (error) {
                console.error("Error fetching statistics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !data) {
        return (
            <main className="w-screen h-screen bg-[#D2D6EF] overflow-hidden">
                <TitleBar />
                <h2>Loading---</h2>
            </main>
        );
    }

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIdx = page * ITEMS_PER_PAGE;
    const pageData = data.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return (
        <main className="w-screen h-screen bg-[#D2D6EF] overflow-hidden flex  flex-col items-center">
            <TitleBar />
            <div className="flex flex-row justify-between w-100 items-center px-10 pt-6 mt-8">
                <button
                    className="cursor-pointer text-2xl px-2 py-1 text-center rounded-4xl bg-[#6331c9] text-white disabled:opacity-50 transition-disabled duration-300"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                >
                    &#8592;
                </button>
                <span className="text-[#6331c9] font-bold">
                    Page {page + 1} of {totalPages}
                </span>
                <button
                    className="cursor-pointer text-2xl px-2 py-1 text-center rounded-4xl bg-[#6331c9] text-white disabled:opacity-50 transition-disabled duration-300"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                >
                    &#8594;
                </button>
            </div>
            <div className="grid grid-cols-3 gap-6 p-10 w-120">
                {pageData.length > 0 ? (
                    pageData.map((entry, index) => (
                        <div
                            key={startIdx + index}
                            className="bg-white rounded-xl p-4 flex flex-col items-center justify-center"
                        >
                            <div className="text-md font-bold text-[#6331c9]">{entry.date}</div>
                            <div className="text-sm mt-2 text-[#6331c9]">{(entry.time / 60).toFixed(1)}h</div>
                            <div className="mt-1 text-sm flex flex-row items-center text-[#6331c9]"><Star achieved={entry.stars != 0} size={22} />&nbsp;{entry.stars}</div>
                        </div>
                    ))
                ) : (
                    <p>No statistics available.</p>
                )}
            </div>
            <div className="absolute flex flex-col gap-y-3 top-103 right-5">
                <button onClick={() => navigate("/home")} className="bg-[#6331c9] w-30 text-white rounded-2xl h-10 hover:h-14 transition-all duration-300 cursor-pointer">Go Back</button>
                <button
                    onClick={() => navigate("/inDepth")}
                    className={`bg-[#6331c9] w-30 text-white rounded-2xl h-10 hover:h-14 transition-all duration-300 cursor-pointer ${data.length <= 2 ? "bg-gray-400 cursor-not-allowed hover:h-10" : ""}`}
                    disabled={data.length <= 2}
                >
                    In-Depth
                </button>            </div>
        </main>
    );
}