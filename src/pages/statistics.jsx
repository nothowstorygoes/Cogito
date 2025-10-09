import TitleBar from "../components/TitleBar";
import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
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
        // Inverte l'ordine dei dati per mostrare le entry più recenti per prime
        const reversedStats = Array.isArray(stats) ? [...stats].reverse() : [];
        setData(reversedStats);
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
      <main className={`w-screen h-screen bg-secondary overflow-hidden flex flex-col justify-center items-center`}>
        <TitleBar />
        <Spinner />
      </main>
    );
  }

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const pageData = data.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <main className={`w-screen h-screen bg-secondary overflow-hidden flex flex-col items-center`}>
      <TitleBar />
      <div
        className={`flex flex-row justify-between w-100 items-center px-10 pt-6 mt-8`}
      >
        <button
          className={`cursor-pointer p-2 text-center hover:opacity-80 disabled:opacity-40 transition-all duration-200 bg-transparent rounded-none`}
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={page === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              display: 'inline-block',
              backgroundColor: 'var(--color-primary)',
              WebkitMaskImage: 'url(/arrowL.svg)',
              maskImage: 'url(/arrowL.svg)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
          <span className="sr-only">Previous page</span>
        </button>
        <span className={`font-bold text-primary`}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          className={`cursor-pointer p-2 text-center hover:opacity-80 disabled:opacity-40 transition-all duration-200 bg-transparent rounded-none`}
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          style={
            page >= totalPages - 1
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}
          }
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              display: 'inline-block',
              backgroundColor: 'var(--color-primary)',
              WebkitMaskImage: 'url(/arrowR.svg)',
              maskImage: 'url(/arrowR.svg)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
          <span className="sr-only">Next page</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-6 p-10 w-120">
        {pageData.length > 0 ? (
          pageData.map((entry, index) => (
            <div
              key={startIdx + index}
              className={`rounded-xl p-4 flex flex-col items-center justify-center transition-colors duration-300 bg-primary-weak text-primary`}
            >
              <div className="text-md font-bold">{entry.date}</div>
              <div className="text-sm mt-2">
                {(entry.time / 60).toFixed(1)}h
              </div>
              <div className="mt-1 text-sm flex flex-row items-center">
                <Star achieved={entry.stars !== 0} size={22} />
                &nbsp;{entry.stars}
              </div>
            </div>
          ))
        ) : (
            <p className="text-xl text-primary text-center w-100 mx-auto">
              No statistics available.
            </p>
        )}
      </div>
      <div className="absolute flex flex-col gap-y-3 top-106 right-5">
        <button
          onClick={() => navigate("/inDepth")}
          className={`w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer bg-primary font-semibold text-secondary hover:opacity-90 hover:h-14
                        ${
                          data.length <= 2
                            ? "!bg-gray-400 text-gray-200 cursor-not-allowed hover:!h-10 "
                            : ""
                        }`}
          disabled={data.length <= 2}
        >
          In-Depth
        </button>
        <button
          onClick={() => navigate("/home")}
          className={`w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer bg-primary text-secondary font-semibold hover:opacity-90 hover:h-14`}
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
