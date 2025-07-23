// Profile.js
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// Main Container for Layout
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #f5f6f8;
`;

// Action icon
const ActionIcon = styled(FaArrowRight)`
  cursor: pointer;
  color: #0f6ab0;
`;

// Sidebar + Content wrapper
const Content = styled.div`
  flex: 1;
  padding: 40px;
  box-sizing: border-box;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;

  @media (max-width: 768px) {
    margin-left: 60px;
    padding: 20px;
  }
`;

// Welcome & details
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

// Buttons & search bar
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

// Status cards
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
  border-radius: 10px;
  border: 1px solid #666;
  @media (max-width: 768px) {
    border: none;
  }
`;
const StatusCard = styled.div`
  background-color: ${(props) => (props.active ? "#0f6ab0" : "#ffffff")};
  color: ${(props) => (props.active ? "#ffffff" : "#000")};
  width: 130px;
  border-right: 1px solid #666;
  padding: 20px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  &:last-child {
    border-right: none;
  }
  @media (max-width: 768px) {
    width: 120px;
    border-right: none;
  }
  @media (max-width: 480px) {
    width: 80px;
    padding: 10px;
    font-size: 14px;
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

// Table
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
  /* ensure filter input sits nicely */
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

// Create Ticket button
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

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center; align-items: center;
  z-index: 1000000;
`;
const ModalContent = styled.div`
  background-color: #fff;
  width: 700px; max-width: 90%;
  padding: 40px; border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  position: relative;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px; margin-bottom: 20px;
`;
const CloseButton = styled.span`
  cursor: pointer; font-size: 24px; color: #999;
  position: absolute; top: 20px; right: 20px;
`;
const ModalBody = styled.div`
  margin-top: 20px; max-height: 60vh; overflow-y: auto; padding-right: 10px;
`;
const DetailRow = styled.div`
  display: flex; flex-wrap: wrap; margin-bottom: 15px;
  font-size: 16px; color: #444;
  strong { width: 200px; }
`;
const FormRow = styled.div`
  display: flex; flex-wrap: wrap; align-items: center;
  margin-bottom: 15px;
  @media (max-width: 480px) {
    flex-direction: column; align-items: flex-start;
  }
`;
const Label = styled.label`
  width: 200px; font-weight: bold; color: #333; margin-bottom: 5px;
  @media (max-width: 480px) { width: 100%; }
`;
const Input = styled.input`
  flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px;
`;
const Select = styled.select`
  flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px;
`;
const ModalFooter = styled.div`
  margin-top: 20px; display: flex; justify-content: flex-end;
`;
const SubmitButton = styled.button`
  background-color: #0f6ab0; color: #fff; border: none;
  border-radius: 5px; padding: 10px 20px; cursor: pointer;
`;
const CancelButton = styled.button`
  background-color: #ccc; color: #000; border: none;
  border-radius: 5px; padding: 10px 20px; margin-left: 10px; cursor: pointer;
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("total");
  const [statusDataState, setStatusDataState] = useState([]);
  const [viewMode, setViewMode] = useState("assignedByMe");
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
  const [isAssignee, setIsAssignee] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [deadlineDateFilter, setDeadlineDateFilter] = useState("");

  // NEW: per‑column filters
  const [columnFilters, setColumnFilters] = useState({
    Ticket_Number: "",
    Creation_Date: "",
    Ticket_Title: "",
    Ticket_Priority: "",
    Incident_Reported_Date: "",
    Incident_Reported_Time: "",
    Assignee_Name: "",
    Expected_Completion_Date: "",
    TStatus: "",
  });

  // Update a single column filter
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  // Fetch user & tickets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
          navigate("/login");
          return;
        }
        // User
        const u = await axios.get(`${API_BASE_URL}/api/user`, {
          params: { email: storedUsername },
        });
        setUserData(u.data);
        // Tickets
        fetchTickets("assignedByMe", u.data.EmpID);
      } catch (e) {
        console.error(e);
        navigate("/login");
      }
    };
    fetchData();
  }, []);

  const fetchTickets = async (mode, empID) => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode, empID },
      });
      const d = r.data || {};
      setTickets(d.tickets || []);
      assembleStatusCards(d.statusCounts || {}, d.previousStatusCounts || {});
    } catch (e) {
      console.error(e);
      setTickets([]);
    }
  };

  // Build status cards
  const assembleStatusCards = (current, previous) => {
    const keys = ["total","unassigned","inProgress","overdue","resolved","closed"];
    const titles = {
      total:"Total",
      unassigned:"Date Unassigned",
      inProgress:"In-Progress",
      overdue:"Overdue",
      resolved:"Resolved",
      closed:"Closed",
    };
    const cards = keys.map((k) => {
      const now = current[k]||0;
      const prev = previous[k]||0;
      return {
        key: k,
        title: titles[k],
        count: now,
        todayCount: Math.max(now - prev, 0),
      };
    });
    setStatusDataState(cards);
  };

  const handleCreateTicket = () => navigate("/ticket");
  const handleViewModeChange = (mode) => { setViewMode(mode); fetchTickets(mode, userData.EmpID); };

  // Check assignee status
  useEffect(() => {
    if (userData.EmpID) {
      axios.get(`${API_BASE_URL}/api/isAssignee`, { params:{empID:userData.EmpID} })
        .then(res=>setIsAssignee(res.data.isAssignee))
        .catch(console.error);
    }
  }, [userData]);

  // Fetch subdepartments & employees when dept/sub-dept changes
  useEffect(() => {
    if (updatedAssigneeDept) {
      axios.get(`${API_BASE_URL}/api/subdepartments`, { params:{department:updatedAssigneeDept} })
        .then(res=>setAssigneeSubDepts(res.data))
        .catch(console.error);
    } else setAssigneeSubDepts([]);
    setUpdatedAssigneeSubDept("");
    setAssigneeEmpIDs([]);
    setUpdatedAssigneeEmpID("");
  }, [updatedAssigneeDept]);

  useEffect(() => {
    if (updatedAssigneeDept && updatedAssigneeSubDept) {
      axios.get(`${API_BASE_URL}/api/employees`, {
        params:{department:updatedAssigneeDept, subdepartment:updatedAssigneeSubDept}
      })
      .then(res=>setAssigneeEmpIDs(res.data))
      .catch(console.error);
    } else setAssigneeEmpIDs([]);
    setUpdatedAssigneeEmpID("");
  }, [updatedAssigneeSubDept]);

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  // Combined filtering + sorting
  const filteredAndSorted = useMemo(() => {
    let data = [...tickets];

    // status filter
    if (statusFilter !== "total") {
      data = data.filter((t) => {
        switch (statusFilter) {
          case "unassigned": return !t.Expected_Completion_Date;
          case "inProgress": return t.TStatus === "In-Progress";
          case "resolved": return t.TStatus === "Resolved";
          case "closed": return t.TStatus === "Closed";
          case "overdue": {
            if (!t.Expected_Completion_Date) return false;
            const today = new Date().setHours(0,0,0,0);
            const exp = new Date(t.Expected_Completion_Date).setHours(0,0,0,0);
            return exp < today && !["Resolved","Closed"].includes(t.TStatus);
          }
          default: return true;
        }
      });
    }

    // per-column filters
    data = data.filter((t) =>
      Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        let field = t[col];
        if (col==="Assignee_Name") {
          field = viewMode==="assignedToMe"? t.Reporter_Name: t.Assignee_Name;
        }
        if (!field) return false;
        return field.toString().toLowerCase().includes(val.toLowerCase());
      })
    );

    // creation date
    if (creationDateFilter) {
      data = data.filter((t) =>
        t.Creation_Date &&
        new Date(t.Creation_Date).toISOString().slice(0,10) === creationDateFilter
      );
    }
    // deadline
    if (deadlineDateFilter) {
      data = data.filter((t) =>
        t.Expected_Completion_Date &&
        new Date(t.Expected_Completion_Date).toISOString().slice(0,10) === deadlineDateFilter
      );
    }

    // sorting
    if (sortConfig.key) {
      data.sort((a,b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const da = Date.parse(aVal), db = Date.parse(bVal);
        if (!isNaN(da) && !isNaN(db)) {
          return sortConfig.direction==="asc"? da-db : db-da;
        }
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction==="asc"? -1:1;
        if (aVal > bVal) return sortConfig.direction==="asc"? 1:-1;
        return 0;
      });
    }

    return data;
  }, [
    tickets,
    statusFilter,
    columnFilters,
    creationDateFilter,
    deadlineDateFilter,
    sortConfig,
    viewMode,
  ]);

  // Submit modal changes
  const handleModalSubmit = async () => {
    try {
      const payload = {
        Ticket_Number: selectedTicket.Ticket_Number,
        Expected_Completion_Date: updatedExpectedDate,
        Ticket_Priority: updatedPriority,
        TStatus: updatedStatus,
        Assignee_Dept: updatedAssigneeDept,
        Assignee_SubDept: updatedAssigneeSubDept,
        Assignee_EmpID: updatedAssigneeEmpID,
      };
      await axios.post(`${API_BASE_URL}/api/update-ticket`, payload);
      setTickets((prev) =>
        prev.map((t) =>
          t.Ticket_Number === selectedTicket.Ticket_Number
            ? { ...t, ...payload }
            : t
        )
      );
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container>
      <Sidebar activeTab="User Profile" />
      <Content>
        <CreateTicketButton onClick={handleCreateTicket}>
          Create Incident
        </CreateTicketButton>
        <WelcomeText>Welcome Back {userData.EmpName}!</WelcomeText>
        <EmployeeDetails>
          Employee ID: {userData.EmpID}<br />
          Department: {userData.Dept}<br />
          Location: {userData.EmpLocation}
        </EmployeeDetails>

        <StatusCardGroup>
          <StatusCardContainer>
            {statusDataState.map((s) => (
              <StatusCard
                key={s.key}
                active={statusFilter === s.key}
                onClick={() => setStatusFilter(s.key)}
              >
                <StatusTitle>{s.title}</StatusTitle>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <StatusCount>{s.count}</StatusCount>
                  <div style={{ fontSize: "14px", color: "#000", marginTop: "5px" }}>
                    {s.todayCount} new today
                  </div>
                </div>
              </StatusCard>
            ))}
          </StatusCardContainer>
        </StatusCardGroup>

        <ButtonGroup>
          <SearchBar>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Filter Title"
              value={columnFilters.Ticket_Title}
              onChange={(e) => handleColumnFilterChange("Ticket_Title", e.target.value)}
            />
          </SearchBar>
          {isAssignee ? (
            <>
              <Button
                active={viewMode === "assignedByMe"}
                onClick={() => handleViewModeChange("assignedByMe")}
              >
                Created by Me
              </Button>
              <Button
                active={viewMode === "assignedToMe"}
                onClick={() => handleViewModeChange("assignedToMe")}
              >
                Assigned to Me
              </Button>
            </>
          ) : (
            <Button active onClick={() => handleViewModeChange("assignedByMe")}>
              My Tickets
            </Button>
          )}
        </ButtonGroup>

        <Table>
          <thead>
            <tr>
              {/* Ticket# */}
              <TableHeader onClick={() => handleSort("Ticket_Number")}>
                Incident# {sortConfig.key==="Ticket_Number"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="text"
                  placeholder="Filter Ticket#"
                  value={columnFilters.Ticket_Number}
                  onChange={(e) => handleColumnFilterChange("Ticket_Number", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Creation Date */}
              <TableHeader onClick={() => handleSort("Creation_Date")}>
                Creation Date {sortConfig.key==="Creation_Date"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="date"
                  value={columnFilters.Creation_Date}
                  onChange={(e) => handleColumnFilterChange("Creation_Date", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Title */}
              <TableHeader>
                Title
                <input
                  type="text"
                  placeholder="Filter Title"
                  value={columnFilters.Ticket_Title}
                  onChange={(e) => handleColumnFilterChange("Ticket_Title", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Priority */}
              <TableHeader onClick={() => handleSort("Ticket_Priority")}>
                Priority {sortConfig.key==="Ticket_Priority"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="text"
                  placeholder="Filter Priority"
                  value={columnFilters.Ticket_Priority}
                  onChange={(e) => handleColumnFilterChange("Ticket_Priority", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Incident Date */}
              <TableHeader onClick={() => handleSort("Incident_Reported_Date")}>
                Incident Date {sortConfig.key==="Incident_Reported_Date"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="date"
                  value={columnFilters.Incident_Reported_Date}
                  onChange={(e) => handleColumnFilterChange("Incident_Reported_Date", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Incident Time */}
              <TableHeader onClick={() => handleSort("Incident_Reported_Time")}>
                Incident Time {sortConfig.key==="Incident_Reported_Time"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="text"
                  placeholder="Filter Time"
                  value={columnFilters.Incident_Reported_Time}
                  onChange={(e) => handleColumnFilterChange("Incident_Reported_Time", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Assigned By / To */}
              <TableHeader>
                {viewMode==="assignedToMe"?"Assigned By":"Assigned To"}
                <input
                  type="text"
                  placeholder="Filter Name"
                  value={columnFilters.Assignee_Name}
                  onChange={(e) => handleColumnFilterChange("Assignee_Name", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Deadline */}
              <TableHeader onClick={() => handleSort("Expected_Completion_Date")}>
                Pending Since {sortConfig.key==="Expected_Completion_Date"?(sortConfig.direction==="asc"?"↑":"↓"):null}
                <input
                  type="date"
                  value={columnFilters.Expected_Completion_Date}
                  onChange={(e) => handleColumnFilterChange("Expected_Completion_Date", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Status */}
              <TableHeader>
                Status
                <input
                  type="text"
                  placeholder="Filter Status"
                  value={columnFilters.TStatus}
                  onChange={(e) => handleColumnFilterChange("TStatus", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHeader>

              {/* Action */}
              <TableHeader>Action</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((ticket) => (
              <tr
                key={ticket.Ticket_Number}
                onClick={() =>
                  navigate(`/ticket/${ticket.Ticket_Number}`, {
                    state: {
                      ticket,
                      emailUser: `${localStorage.getItem("username")}@premierenergies.com`,
                    },
                  })
                }
              >
                <TableData>{ticket.Ticket_Number}</TableData>
                <TableData>
                  {ticket.Creation_Date
                    ? new Date(ticket.Creation_Date).toISOString().split("T")[0]
                    : "N/A"}
                </TableData>
                <TableData>{ticket.Ticket_Title}</TableData>
                <TableData>{ticket.Ticket_Priority}</TableData>
                <TableData>
                  {ticket.Incident_Reported_Date
                    ? new Date(ticket.Incident_Reported_Date).toISOString().split("T")[0]
                    : ticket.Creation_Date}
                </TableData>
                <TableData>
                  {ticket.Incident_Reported_Time
                    ? ticket.Incident_Reported_Time.slice(11, 16)
                    : "N/A"}
                </TableData>
                <TableData>
                  {viewMode === "assignedToMe"
                    ? ticket.Reporter_Name
                    : ticket.Assignee_Name}
                </TableData>
                <TableData>
                  {ticket.Expected_Completion_Date
                    ? (() => {
                        const exp = new Date(ticket.Expected_Completion_Date).setHours(0,0,0,0);
                        const today = new Date().setHours(0,0,0,0);
                        const diff = Math.ceil((exp - today)/(1000*60*60*24));
                        if (diff>0) return `In ${diff} day${diff!==1?"s":""}`;
                        if (diff===0) return "Today";
                        return `${Math.abs(diff)} day${Math.abs(diff)!==1?"s":""}`;
                      })()
                    : "N/A"}
                </TableData>
                <TableData>{ticket.TStatus}</TableData>
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
                <CloseButton onClick={()=>setShowModal(false)}>×</CloseButton>
              </ModalHeader>
              <ModalBody>
                <DetailRow><strong>Ticket#: </strong>{selectedTicket.Ticket_Number}</DetailRow>
                <DetailRow><strong>Creation Date: </strong>{selectedTicket.Creation_Date}</DetailRow>
                <DetailRow><strong>Title: </strong>{selectedTicket.Ticket_Title}</DetailRow>
                <DetailRow><strong>Description: </strong>{selectedTicket.Ticket_Description}</DetailRow>
                <DetailRow><strong>Type: </strong>{selectedTicket.Ticket_Type}</DetailRow>
                <DetailRow><strong>Sub Task: </strong>{selectedTicket.Sub_Task}</DetailRow>
                <DetailRow><strong>Label: </strong>{selectedTicket.Task_Label}</DetailRow>
                <DetailRow><strong>Priority: </strong>{selectedTicket.Ticket_Priority}</DetailRow>
                <DetailRow><strong>Assignee Dept: </strong>{selectedTicket.Assignee_Dept}</DetailRow>
                <DetailRow><strong>Assignee SubDept: </strong>{selectedTicket.Assignee_SubDept}</DetailRow>
                <DetailRow><strong>Assignee EmpID: </strong>{selectedTicket.Assignee_EmpID}</DetailRow>
                <DetailRow><strong>Reporter: </strong>{selectedTicket.Reporter_Name} ({selectedTicket.Reporter_Email})</DetailRow>
                <DetailRow><strong>Status: </strong>{selectedTicket.TStatus}</DetailRow>

                {/* Editable fields */}
                <FormRow>
                  <Label>Status:</Label>
                  <Select value={updatedStatus} onChange={e=>setUpdatedStatus(e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </Select>
                </FormRow>
                <FormRow>
                  <Label>Assignee Dept:</Label>
                  <Select value={updatedAssigneeDept} onChange={e=>setUpdatedAssigneeDept(e.target.value)}>
                    <option value="">Select Dept</option>
                    {assigneeDepts.map(d=>(
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </FormRow>
                <FormRow>
                  <Label>Assignee SubDept:</Label>
                  <Select disabled={!updatedAssigneeDept} value={updatedAssigneeSubDept} onChange={e=>setUpdatedAssigneeSubDept(e.target.value)}>
                    <option value="">Select SubDept</option>
                    {assigneeSubDepts.map(sd=>(
                      <option key={sd} value={sd}>{sd}</option>
                    ))}
                  </Select>
                </FormRow>
                <FormRow>
                  <Label>Assignee Emp:</Label>
                  <Select disabled={!updatedAssigneeSubDept} value={updatedAssigneeEmpID} onChange={e=>setUpdatedAssigneeEmpID(e.target.value)}>
                    <option value="">Select Employee</option>
                    {assigneeEmpIDs.map(emp=>(
                      <option key={emp.EmpID} value={emp.EmpID}>{emp.EmpName}</option>
                    ))}
                  </Select>
                </FormRow>
                <FormRow>
                  <Label>Expected Completion:</Label>
                  <Input type="date" value={updatedExpectedDate} onChange={e=>setUpdatedExpectedDate(e.target.value)} />
                </FormRow>
                <FormRow>
                  <Label>Priority:</Label>
                  <Select value={updatedPriority} onChange={e=>setUpdatedPriority(e.target.value)}>
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Select>
                </FormRow>
              </ModalBody>
              <ModalFooter>
                <SubmitButton onClick={handleModalSubmit}>Submit</SubmitButton>
                <CancelButton onClick={()=>setShowModal(false)}>Cancel</CancelButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </Content>
    </Container>
  );
};

export default Dashboard;
