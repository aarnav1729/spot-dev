// Department.js
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaArrowRight, FaArrowUp, FaArrowDown } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// Helper function to fix reporter name duplication.
const formatReporterName = (name) => {
  if (!name) return "";
  const trimmed = String(name).trim();
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
      return parts[0].trim();
    }
  }
  const words = trimmed.split(/\s+/);
  if (words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(" ");
    const secondHalf = words.slice(half).join(" ");
    if (firstHalf === secondHalf) {
      return firstHalf;
    }
  }
  return trimmed;
};

// Styled components
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #f5f6f8;
`;

const ActionIcon = styled(FaArrowRight)`
  cursor: pointer;
  color: #0f6ab0;
`;

const PercentageChange = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
  font-size: 14px;
  color: ${(props) => (props.isIncrease ? "green" : "red")};
`;

const Content = styled.div`
  flex: 1;
  padding: 40px;
  box-sizing: border-box;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    margin-left: 60px;
    padding: 20px;
  }
`;

const WelcomeText = styled.h1`
  color: #333;
  font-size: 28px;
  margin-bottom: 15px;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const EmployeeDetails = styled.p`
  color: #777;
  font-size: 16px;
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #f0f4f7;
  border-radius: 30px;
  padding: 10px 20px;
  width: 25%;
  margin-right: 20px;

  @media (max-width: 768px) {
    width: 60%;
    margin-right: 0;
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    width: 80%;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 16px;
  color: #333;
`;

const SearchIcon = styled(FaSearch)`
  margin-right: 10px;
  color: #0f6ab0;
`;

const Button = styled.button`
  background-color: ${(props) => (props.active ? "#0f6ab0" : "#ffffff")};
  color: ${(props) => (props.active ? "#ffffff" : "#0f6ab0")};
  border: 2px solid #0f6ab0;
  border-radius: 25px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #0f6ab0;
    color: white;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 15px;
    margin-bottom: 10px;
  }

  @media (max-width: 400px) {
    width: 100%;
    margin-right: 0;
  }
`;

const StatusCardGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    max-width: 360px;
    margin: 0 auto;
    justify-content: flex-start;
  }
`;

const StatusCardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 10px 0;
`;

const StatusCard = styled.div`
  background-color: ${(props) => (props.active ? props.color : "#ffffff")};
  color: ${(props) => (props.active ? "#ffffff" : "#000")};
  width: 130px;
  border-radius: 10px;
  border: 1px solid ${(props) => props.color};
  padding: 20px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatusTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 10px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 1px;
`;

const StatusCount = styled.p`
  font-size: 24px;
  font-weight: bold;
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const TableHeader = styled.th`
  border-bottom: 2px solid #cccccc;
  padding: 12px;
  text-align: left;
  background-color: #f9f9f9;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10000;

  & > input {
    margin-top: 5px;
    width: 100%;
    padding: 4px 6px;
    font-size: 12px;
    box-sizing: border-box;
  }
`;

const TableData = styled.td`
  border-bottom: 1px solid #e0e0e0;
  padding: 12px;
  font-family: "Montserrat", sans-serif;
`;

const CreateTicketButton = styled.button`
  position: absolute;
  top: 90px;
  right: 20px;
  background-color: #61b847;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;

  @media (max-width: 768px) {
    position: static;
    margin-bottom: 20px;
    font-size: 14px;
    padding: 10px 20px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000000;
`;

const ModalContent = styled.div`
  background-color: #fff;
  width: 700px;
  max-width: 90%;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const CloseButton = styled.span`
  cursor: pointer;
  font-size: 24px;
  color: #999;
  position: absolute;
  top: 20px;
  right: 20px;
`;

const ModalBody = styled.div`
  margin-top: 20px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
  font-size: 16px;
  color: #444;

  strong {
    width: 200px;
  }
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 15px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Label = styled.label`
  width: 200px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Select = styled.select`
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const ModalFooter = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled.button`
  background-color: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
`;

const CancelButton = styled.button`
  background-color: #ccc;
  color: #000;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  margin-left: 10px;
  cursor: pointer;
`;

const DepartmentDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [tickets, setTickets] = useState([]);
  const [statusDataState, setStatusDataState] = useState([]);
  const [viewMode, setViewMode] = useState("assignedByDept");

  // Sorting, status-card filter, global search, date filters, column filters
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("total");
  const [searchTerm, setSearchTerm] = useState("");
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [deadlineDateFilter, setDeadlineDateFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    Ticket_Number: "",
    Creation_Date: "",
    Ticket_Title: "",
    Ticket_Priority: "",
    Reporter_Name: "",
    Assignee_Name: "",
    Expected_Completion_Date: "",
    TStatus: ""
  });

  // Editable/modal state (if needed)
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatedExpectedDate, setUpdatedExpectedDate] = useState("");
  const [updatedPriority, setUpdatedPriority] = useState("");
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [updatedAssigneeDept, setUpdatedAssigneeDept] = useState("");
  const [updatedAssigneeSubDept, setUpdatedAssigneeSubDept] = useState("");
  const [updatedAssigneeEmpID, setUpdatedAssigneeEmpID] = useState("");
  const [assigneeDepts, setAssigneeDepts] = useState([]);
  const [assigneeSubDepts, setAssigneeSubDepts] = useState([]);
  const [assigneeEmpIDs, setAssigneeEmpIDs] = useState([]);

  // Fetch user & tickets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
          navigate("/login");
          return;
        }
        const u = await axios.get(`${API_BASE_URL}/api/user`, {
          params: { email: storedUsername }
        });
        setUserData(u.data);
        fetchTickets("assignedByDept", u.data.Dept);
      } catch (e) {
        console.error(e);
        navigate("/login");
      }
    };
    fetchData();
  }, [navigate]);

  // Fetch tickets + status counts
  const fetchTickets = async (mode, department) => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode, department }
      });
      const d = r.data || {};
      const tix = d.tickets || [];
      setTickets(tix);

      // assemble status cards
      const current = d.statusCounts || {};
      const previous = d.previousStatusCounts || {};
      const template = [
        { key: "total", title: "Total", color: "#FF6F61" },
        { key: "unassigned", title: "Unassigned", color: "#FBC02D" },
        { key: "inProgress", title: "In‑Progress", color: "#4CAF50" },
        { key: "overdue", title: "Overdue", color: "#E53935" },
        { key: "resolved", title: "Resolved", color: "#1E88E5" },
        { key: "closed", title: "Closed", color: "#8E24AA" }
      ];
      const cards = template.map((s) => {
        const now = current[s.key] || 0;
        const prev = previous[s.key] || 0;
        return { ...s, count: now, todayCount: Math.max(0, now - prev) };
      });
      setStatusDataState(cards);
    } catch (e) {
      console.error(e);
      setTickets([]);
      setStatusDataState([]);
    }
  };

  const handleCreateTicket = () => navigate("/ticket");

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    fetchTickets(mode, userData.Dept);
    setStatusFilter("total");
    setSearchTerm("");
    setCreationDateFilter("");
    setDeadlineDateFilter("");
    setColumnFilters({
      Ticket_Number: "",
      Creation_Date: "",
      Ticket_Title: "",
      Ticket_Priority: "",
      Reporter_Name: "",
      Assignee_Name: "",
      Expected_Completion_Date: "",
      TStatus: ""
    });
  };

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  // Column filter handler
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  // Combined status, global search, column filters, date filters, sorting
  const filteredAndSorted = useMemo(() => {
    let data = [...tickets];

    // status-card filtering
    if (statusFilter !== "total") {
      data = data.filter((t) => {
        switch (statusFilter) {
          case "unassigned":
            return !t.Expected_Completion_Date;
          case "inProgress":
            return t.TStatus === "In-Progress";
          case "resolved":
            return t.TStatus === "Resolved";
          case "closed":
            return t.TStatus === "Closed";
          case "overdue": {
            if (!t.Expected_Completion_Date) return false;
            const today = new Date().setHours(0,0,0,0);
            const exp = new Date(t.Expected_Completion_Date).setHours(0,0,0,0);
            return exp < today && !["Resolved","Closed"].includes(t.TStatus);
          }
          default:
            return true;
        }
      });
    }

    // global search
    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      data = data.filter((t) =>
        Object.values(t).some((v) =>
          String(v || "").toLowerCase().includes(st)
        )
      );
    }

    // per-column filters
    data = data.filter((t) =>
      Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        let fieldValue = "";
        if (col === "Creation_Date" || col === "Expected_Completion_Date") {
          fieldValue = t[col]
            ? new Date(t[col]).toISOString().slice(0,10)
            : "";
        } else if (col === "Reporter_Name") {
          fieldValue = t.Reporter_Name || "";
        } else if (col === "Assignee_Name") {
          fieldValue = t.Assignee_Name || "";
        } else {
          fieldValue = t[col] != null ? String(t[col]) : "";
        }
        return fieldValue.toLowerCase().includes(val.toLowerCase());
      })
    );

    // date filters
    if (creationDateFilter) {
      data = data.filter((t) =>
        t.Creation_Date &&
        new Date(t.Creation_Date).toISOString().slice(0,10) ===
          creationDateFilter
      );
    }
    if (deadlineDateFilter) {
      data = data.filter((t) =>
        t.Expected_Completion_Date &&
        new Date(t.Expected_Completion_Date).toISOString().slice(0,10) ===
          deadlineDateFilter
      );
    }

    // sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        // date sort?
        const da = Date.parse(aVal);
        const db = Date.parse(bVal);
        if (!isNaN(da) && !isNaN(db)) {
          return sortConfig.direction === "asc" ? da - db : db - da;
        }
        aVal = aVal != null ? String(aVal).toLowerCase() : "";
        bVal = bVal != null ? String(bVal).toLowerCase() : "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [
    tickets,
    statusFilter,
    searchTerm,
    columnFilters,
    creationDateFilter,
    deadlineDateFilter,
    sortConfig
  ]);

  // Navigate to ticket detail
  const handleRowClick = (t) => {
    const fullEmail = `${localStorage.getItem("username")}@premierenergies.com`;
    navigate(`/ticket/${t.Ticket_Number}`, { state: { ticket: t, emailUser: fullEmail } });
  };

  return (
    <Container>
      <Sidebar activeTab="Department" />
      <Content>
        <CreateTicketButton onClick={handleCreateTicket}>
          Create Ticket
        </CreateTicketButton>
        <WelcomeText>Welcome Back {userData.EmpName}!</WelcomeText>
        <EmployeeDetails>
          Employee ID: {userData.EmpID}<br/>
          Department: {userData.Dept}<br/>
          Location: {userData.EmpLocation}
        </EmployeeDetails>

        <StatusCardGroup>
          <StatusCardContainer>
            {statusDataState.map((s) => (
              <StatusCard
                key={s.key}
                color={s.color}
                active={statusFilter === s.key}
                onClick={() => setStatusFilter(s.key)}
              >
                <StatusTitle>{s.title}</StatusTitle>
                <StatusCount>{s.count}</StatusCount>
                <PercentageChange isIncrease={s.todayCount >= 0}>
                  {s.todayCount} new today
                </PercentageChange>
              </StatusCard>
            ))}
          </StatusCardContainer>
        </StatusCardGroup>

        <ButtonGroup>
          <SearchBar>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Global Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
          <Button
            active={viewMode === "assignedByDept"}
            onClick={() => handleViewModeChange("assignedByDept")}
          >
            Created by Department
          </Button>
          <Button
            active={viewMode === "assignedToDept"}
            onClick={() => handleViewModeChange("assignedToDept")}
          >
            Assigned to Department
          </Button>
        </ButtonGroup>

        <Table>
          <thead>
            <tr>
              <TableHeader onClick={() => handleSort("Ticket_Number")}>
                Ticket# {sortConfig.key === "Ticket_Number" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="text"
                  placeholder="Filter Ticket#"
                  value={columnFilters.Ticket_Number}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Ticket_Number", e.target.value)}
                />
              </TableHeader>

              <TableHeader onClick={() => handleSort("Creation_Date")}>
                Creation Date {sortConfig.key === "Creation_Date" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="date"
                  value={columnFilters.Creation_Date}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Creation_Date", e.target.value)}
                />
              </TableHeader>

              <TableHeader onClick={() => handleSort("Ticket_Title")}>
                Title {sortConfig.key === "Ticket_Title" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="text"
                  placeholder="Filter Title"
                  value={columnFilters.Ticket_Title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Ticket_Title", e.target.value)}
                />
              </TableHeader>

              <TableHeader onClick={() => handleSort("Ticket_Priority")}>
                Priority {sortConfig.key === "Ticket_Priority" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="text"
                  placeholder="Filter Priority"
                  value={columnFilters.Ticket_Priority}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Ticket_Priority", e.target.value)}
                />
              </TableHeader>

              <TableHeader>
                {viewMode === "assignedToDept" ? "Assigned By" : "Created By"}
                <input
                  type="text"
                  placeholder="Filter Reporter"
                  value={columnFilters.Reporter_Name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Reporter_Name", e.target.value)}
                />
              </TableHeader>

              <TableHeader>
                Assignee
                <input
                  type="text"
                  placeholder="Filter Assignee"
                  value={columnFilters.Assignee_Name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Assignee_Name", e.target.value)}
                />
              </TableHeader>

              <TableHeader onClick={() => handleSort("Expected_Completion_Date")}>
                Deadline {sortConfig.key === "Expected_Completion_Date" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="date"
                  value={columnFilters.Expected_Completion_Date}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("Expected_Completion_Date", e.target.value)}
                />
              </TableHeader>

              <TableHeader onClick={() => handleSort("TStatus")}>
                Status {sortConfig.key === "TStatus" ? (sortConfig.direction==="asc"?<FaArrowUp/>:<FaArrowDown/>) : null}
                <input
                  type="text"
                  placeholder="Filter Status"
                  value={columnFilters.TStatus}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleColumnFilterChange("TStatus", e.target.value)}
                />
              </TableHeader>

              <TableHeader>Action</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((t) => (
              <tr key={t.Ticket_Number} onClick={() => handleRowClick(t)}>
                <TableData>{t.Ticket_Number}</TableData>
                <TableData>
                  {t.Creation_Date
                    ? new Date(t.Creation_Date).toISOString().split("T")[0]
                    : "N/A"}
                </TableData>
                <TableData>{t.Ticket_Title}</TableData>
                <TableData>{t.Ticket_Priority}</TableData>
                <TableData>
                  {viewMode === "assignedToDept"
                    ? formatReporterName(t.Reporter_Name)
                    : t.Assignee_Name}
                </TableData>
                <TableData>{t.Assignee_Name}</TableData>
                <TableData>
                  {t.TStatus === "Closed" || t.TStatus === "Resolved"
                    ? "Closed"
                    : t.Expected_Completion_Date
                    ? (() => {
                        const ed = new Date(t.Expected_Completion_Date).setHours(0,0,0,0);
                        const today = new Date().setHours(0,0,0,0);
                        const diff = Math.ceil((ed - today) / (1000*60*60*24));
                        if (diff > 0) return `In ${diff} day${diff!==1?"s":""}`;
                        if (diff === 0) return "Today";
                        return `Overdue by ${Math.abs(diff)} day${Math.abs(diff)!==1?"s":""}`;
                      })()
                    : "N/A"}
                </TableData>
                <TableData>{t.TStatus}</TableData>
                <TableData><ActionIcon /></TableData>
              </tr>
            ))}
          </tbody>
        </Table>

        {showModal && selectedTicket && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>
                <h2>Ticket Details</h2>
                <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
              </ModalHeader>
              <ModalBody>
                <DetailRow>
                  <strong>Ticket#: </strong>{selectedTicket.Ticket_Number}
                </DetailRow>
                {/* ...additional detail rows and form fields here... */}
              </ModalBody>
              <ModalFooter>
                <SubmitButton onClick={() => {/* submit logic */}}>Submit</SubmitButton>
                <CancelButton onClick={() => setShowModal(false)}>Cancel</CancelButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </Content>
    </Container>
  );
};

export default DepartmentDashboard;
