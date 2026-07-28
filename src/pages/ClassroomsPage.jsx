import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/AppLayout";
import SearchField from "../components/SearchField";
import ClassroomCard from "../components/ClassroomCard";
import { Plus, School, ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import ViewModeToggle from "../components/ViewModeToggle.jsx";
import useViewMode, { VIEW_MODE_TILES } from "../hooks/useViewMode.js";
import useSortableList from "../hooks/useSortableList.js";
import { classroomsColumns } from "../utils/classroomTable.js";
import InfoTip from "../components/InfoTip.jsx";

const ClassroomsPage = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useViewMode("classrooms");

  const breadcrumbs = [
    { label: "Dashboard", href: "/home" },
    { label: "Classrooms", href: "/classrooms" }
  ];

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/classrooms");
        setClassrooms(response.data.classrooms || []);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        toast.error("Failed to load classrooms");
        setClassrooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const term = searchTerm.trim().toLowerCase();
  const filteredBase = term
    ? classrooms.filter((c) =>
        [c.name, c.teacher?.name, c.assistantTeacher?.name, c.center]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))
      )
    : classrooms;

  const {
    sortedItems: filteredClassrooms,
    activeSort: classroomsSort,
    cycleSort: cycleClassroomsSort,
    ariaSortFor: classroomsAriaSortFor,
  } = useSortableList(filteredBase, "classrooms", classroomsColumns);

  const renderSortIcon = (columnKey) => {
    if (!classroomsSort || classroomsSort.column !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" aria-hidden="true" />;
    }
    return classroomsSort.direction === "asc" ? (
      <ArrowUp className="w-3 h-3" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3 h-3" aria-hidden="true" />
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <School className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-base-content flex items-center gap-2">
                    Classrooms
                    <InfoTip helpKey="page.classrooms" />
                  </h1>
                  <p className="text-base-content/70 text-sm">
                    All classrooms across every center
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => navigate("/classrooms/create")}
                  className="btn btn-primary gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Classroom
                </button>
                <InfoTip helpKey="control.createClassroom" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
              <div className="form-control w-full max-w-md">
                <SearchField
                  inputSize=""
                  placeholder="Search by classroom, teacher, or center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ViewModeToggle
                value={viewMode}
                onChange={setViewMode}
                ariaLabel="Classrooms list view mode"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : filteredClassrooms.length > 0 ? (
              viewMode === VIEW_MODE_TILES ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredClassrooms.map((classroom) => (
                    <ClassroomCard key={classroom.id} classroom={classroom} />
                  ))}
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl min-w-0">
                  <div className="card-body p-0">
                    <div className="overflow-x-auto min-w-0">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>#</th>
                            {classroomsColumns.map((col) => (
                              <th key={col.key} aria-sort={classroomsAriaSortFor(col.key)}>
                                <button
                                  type="button"
                                  onClick={() => cycleClassroomsSort(col.key)}
                                  className="flex items-center gap-1 hover:underline"
                                >
                                  {col.label}
                                  {renderSortIcon(col.key)}
                                </button>
                              </th>
                            ))}
                            <th>Assistant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClassrooms.map((classroom, index) => (
                            <tr key={classroom.id} className="hover">
                              <td>{index + 1}</td>
                              <td>
                                <span className="font-semibold">
                                  {classroom.teacher?.name || "No lead teacher"}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => navigate(`/classrooms/${classroom.id}`)}
                                  className="link link-primary hover:underline"
                                >
                                  {classroom.name}
                                </button>
                              </td>
                              <td>
                                <span className="badge badge-secondary badge-sm gap-1">
                                  <Users className="w-3 h-3" />
                                  {classroom.childCount ?? 0}
                                </span>
                              </td>
                              <td>
                                {classroom.center ? (
                                  <span className="badge badge-primary">{classroom.center}</span>
                                ) : (
                                  <span className="text-base-content/50">—</span>
                                )}
                              </td>
                              <td>{classroom.assistantTeacher?.name || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="card bg-base-100 shadow-xl border border-dashed border-base-300">
                <div className="card-body items-center text-center py-16">
                  <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <School className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="card-title">
                    {term ? "No classrooms match your search" : "No classrooms yet"}
                  </h3>
                  <p className="text-base-content/70 max-w-md">
                    {term
                      ? "Try a different classroom, teacher, or center name."
                      : "Create the first classroom to get started."}
                  </p>
                  {!term && (
                    <button
                      onClick={() => navigate("/classrooms/create")}
                      className="btn btn-primary gap-2 mt-3"
                    >
                      <Plus className="w-4 h-4" />
                      Create Classroom
                    </button>
                  )}
                </div>
              </div>
            )}
      </div>
    </AppLayout>
  );
};

export default ClassroomsPage;
