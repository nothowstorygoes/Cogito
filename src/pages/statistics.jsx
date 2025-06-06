import TitleBar from "../components/TitleBar";
import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import Star from "../components/star";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/themeProvider";

const ITEMS_PER_PAGE = 8;

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { dark } = useTheme();

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
      <main
        className={`w-screen h-screen ${
          dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
        } overflow-hidden flex flex-col justify-center items-center`}
      >
        <TitleBar />
        <Spinner />
      </main>
    );
  }

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const pageData = data.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <main
      className={`w-screen h-screen ${
        dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
      } overflow-hidden flex flex-col items-center`}
    >
      <TitleBar />
      <div
        className={`flex flex-row justify-between w-100 items-center px-10 pt-6 mt-8`}
      >
        <button
          className={`cursor-pointer text-2xl px-2 py-1 text-center rounded-4xl
                        ${
                          dark
                            ? "bg-[#D2D6EF] text-[#181825] border border-[#D2D6EF] hover:bg-[#b8bce0]"
                            : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                        }
                        disabled:opacity-50 transition-all duration-300`}
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={page === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          &#8592;
        </button>
        <span
          className={`font-bold ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}
        >
          Page {page + 1} of {totalPages}
        </span>
        <button
          className={`cursor-pointer text-2xl px-2 py-1 text-center rounded-4xl
                        ${
                          dark
                            ? "bg-[#D2D6EF] text-[#181825] border border-[#D2D6EF] hover:bg-[#b8bce0]"
                            : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                        }
                        disabled:opacity-50 transition-all duration-300`}
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          style={
            page >= totalPages - 1
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}
          }
        >
          &#8594;
        </button>
      </div>
      <div className="grid grid-cols-3 gap-6 p-10 w-120">
        {pageData.length > 0 ? (
          pageData.map((entry, index) => (
            <div
              key={startIdx + index}
              className={`rounded-xl p-4 flex flex-col items-center justify-center transition-colors duration-300
                                ${
                                  dark
                                    ? "bg-[#23263a] text-[#D2D6EF]"
                                    : "bg-white text-[#6331c9]"
                                }`}
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
            <p className="text-xl dark:text-[#d2d6ef] text-[#6631c9] text-center w-100 mx-auto">
              No statistics available.
            </p>
        )}
      </div>
      <div className="absolute flex flex-col gap-y-3 top-103 right-5">
        <button
          onClick={() => navigate("/inDepth")}
          className={`w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer
                        ${
                          dark
                            ? "font-semibold bg-[#D2D6EF] text-[#181825] border border-[#D2D6EF] hover:bg-[#b8bce0]"
                            : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                        }
                        hover:h-14
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
          className={`w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer
                        ${
                          dark
                            ? "font-semibold bg-[#D2D6EF] text-[#181825] border border-[#D2D6EF] hover:bg-[#b8bce0]"
                            : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                        } hover:h-14`}
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
