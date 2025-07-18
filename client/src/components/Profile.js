import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaArrowRight, FaArrowUp, FaArrowDown } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// Main Container for Layout – removed the mobile media query that changed flex-direction
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px); /* Adjusting for header height */
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

// CONTENT: Apply a left margin equal to the fixed sidebar width.
const Content = styled.div`
  flex: 1;
  padding: 40px;
  box-sizing: border-box;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    margin-left: 60px; /* For collapsed sidebar on smaller screens */
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

// Reduce the bottom margin of employee details for closer spacing.
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

// StatusCardGroup: On very small screens, constrain the max-width and left-align the cards.
const StatusCardGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 15px; /* reduced spacing */
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

// StatusCard: decrease dimensions on mobile
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
`;

const TableData = styled.td`
  border-bottom: 1px solid #e0e0e0;
  padding: 12px;
  font-family: "Montserrat", sans-serif;
`;

const PriorityStar = styled.span`
  color: gold;
  font-size: 20px;
  cursor: pointer;
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

const tno = styled.th`
  color: blue;
  font-weight: bold;
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("total");
  const [filteredTickets, setFilteredTickets] = useState([]); // State for filtered tickets
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [statusCounts, setStatusCounts] = useState({});
  const [viewMode, setViewMode] = useState("assignedByMe");
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatedExpectedDate, setUpdatedExpectedDate] = useState("");
  const [updatedPriority, setUpdatedPriority] = useState("");
  const [statusDataState, setStatusDataState] = useState([]);
  // Editable fields
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [updatedAssigneeDept, setUpdatedAssigneeDept] = useState("");
  const [updatedAssigneeSubDept, setUpdatedAssigneeSubDept] = useState("");
  const [updatedAssigneeEmpID, setUpdatedAssigneeEmpID] = useState("");

  // Dropdown options
  const [assigneeDepts, setAssigneeDepts] = useState([]);
  const [assigneeSubDepts, setAssigneeSubDepts] = useState([]);
  const [assigneeEmpIDs, setAssigneeEmpIDs] = useState([]);
  const [isAssignee, setIsAssignee] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [deadlineDateFilter, setDeadlineDateFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
          navigate("/login");
          return;
        }

        // Fetch user data
        const userResponse = await axios.get(`${API_BASE_URL}/api/user`, {
          params: { email: storedUsername },
        });
        setUserData(userResponse.data);

        console.log("username is", storedUsername);
        console.log("location is", userResponse.data.EmpLocation);

        // Fetch tickets assigned to the user by default
        fetchTickets("assignedByMe", userResponse.data.EmpID);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchData();
  }, []);

  const fetchTickets = async (mode, empID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: {
          mode,
          empID,
        },
      });

      // Provide safe defaults if the server did not return these fields
      const data = response.data || {};
      const safeTickets = data.tickets || [];
      const safeStatusCounts = data.statusCounts || {};
      const safePreviousCounts = data.previousStatusCounts || {};

      setTickets(response.data.tickets);
      setStatusCounts(response.data.statusCounts);

      // Safe references
      const currentCounts = safeStatusCounts;
      const previousCounts = safePreviousCounts;

      // Calculate percentage changes
      const calculatePercentageChange = (current, previous) => {
        if (previous === 0) {
          if (current === 0) return 0;
          return 100; // Avoid division by zero
        }
        return ((current - previous) / previous) * 100;
      };

      const statusDataArray = [
        {
          key: "total",
          title: "Total",
          color: "#FF6F61",
          count: currentCounts.total || 0,
          previousCount: previousCounts.total || 0,
        },
        {
          key: "unassigned",
          title: "Date Unassigned",
          color: "#FBC02D",
          count: currentCounts.unassigned || 0,
          previousCount: previousCounts.unassigned || 0,
        },
        {
          key: "inProgress",
          title: "In-Progress",
          color: "#4CAF50",
          count: currentCounts.inProgress || 0,
          previousCount: previousCounts.inProgress || 0,
        },
        {
          key: "overdue",
          title: "Overdue",
          color: "#E53935",
          count: currentCounts.overdue || 0,
          previousCount: previousCounts.overdue || 0,
        },
        {
          key: "resolved",
          title: "Resolved",
          color: "#1E88E5",
          count: currentCounts.resolved || 0,
          previousCount: previousCounts.resolved || 0,
        },
        {
          key: "closed",
          title: "Closed",
          color: "#8E24AA",
          count: currentCounts.closed || 0,
          previousCount: previousCounts.closed || 0,
        },
      ];

      // Update statusData with percentage changes
      const updatedStatusData = statusDataArray.map((status) => {
        // how many of this status appeared today:
        const todayCount = (status.count || 0) - (status.previousCount || 0);
        return {
          ...status,
          todayCount: todayCount > 0 ? todayCount : 0,
        };
      });
      setStatusDataState(updatedStatusData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTickets([]);
      setStatusCounts({});
      setStatusDataState([]);
    }
  };

  const handleCreateTicket = () => {
    navigate("/ticket");
  };

  // Handle Search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setFilteredTickets(tickets); // Show all tickets when search is cleared
      return;
    }

    const filtered = tickets.filter((ticket) =>
      Object.values(ticket).some((value) => {
        if (value === null || value === undefined) return false; // Skip null/undefined values
        if (typeof value !== "string" && typeof value !== "number")
          return false; // Skip non-string/number fields
        return value.toString().toLowerCase().includes(term); // Check if term is included
      })
    );

    setFilteredTickets(filtered);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    fetchTickets(mode, userData.EmpID);
  };

  // Fetch SubDepartments when Assignee Department changes
  useEffect(() => {
    if (updatedAssigneeDept) {
      axios
        .get(`${API_BASE_URL}/api/subdepartments`, {
          params: { department: updatedAssigneeDept },
        })
        .then((response) => {
          setAssigneeSubDepts(response.data);
        })
        .catch((error) => {
          console.error("Error fetching subdepartments:", error);
        });
    } else {
      setAssigneeSubDepts([]);
    }
    setUpdatedAssigneeSubDept("");
    setAssigneeEmpIDs([]);
    setUpdatedAssigneeEmpID("");
  }, [updatedAssigneeDept]);

  // Fetch Employees when Assignee SubDept changes
  useEffect(() => {
    if (updatedAssigneeDept && updatedAssigneeSubDept) {
      axios
        .get(`${API_BASE_URL}/api/employees`, {
          params: {
            department: updatedAssigneeDept,
            subdepartment: updatedAssigneeSubDept,
          },
        })
        .then((response) => {
          setAssigneeEmpIDs(response.data);
        })
        .catch((error) => {
          console.error("Error fetching employees:", error);
        });
    } else {
      setAssigneeEmpIDs([]);
    }
    setUpdatedAssigneeEmpID("");
  }, [updatedAssigneeSubDept]);

  // Update the click handler to navigate to STicket page
  const handleActionClick = (ticket) => {
    const storedUsername = localStorage.getItem("username");
    const fullEmailUser = `${storedUsername}@premierenergies.com`; // Append domain
    navigate(`/ticket/${ticket.Ticket_Number}`, {
      state: { ticket, emailUser: fullEmailUser },
    });
  };

  useEffect(() => {
    setFilteredTickets(tickets); // Sync filteredTickets with tickets
  }, [tickets]);

  useEffect(() => {
    if (userData && userData.EmpID) {
      axios
        .get(`${API_BASE_URL}/api/isAssignee`, {
          params: { empID: userData.EmpID },
        })
        .then((response) => {
          setIsAssignee(response.data.isAssignee);
        })
        .catch((err) => console.error("Error checking assignee status:", err));
    }
  }, [userData]);

  // SORT HANDLER
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // APPLY SEARCH, DATE FILTERS & SORT
  const filteredAndSorted = useMemo(() => {
    let data = tickets;

    if (statusFilter && statusFilter !== "total") {
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exp = new Date(t.Expected_Completion_Date);
            exp.setHours(0, 0, 0, 0);
            return (
              exp < today && t.TStatus !== "Resolved" && t.TStatus !== "Closed"
            );
          }
          default:
            return true;
        }
      });
    }

    // text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((t) =>
        Object.values(t).some((v) => ("" + v).toLowerCase().includes(term))
      );
    }

    // creation-date filter
    if (creationDateFilter) {
      data = data.filter(
        (t) =>
          t.Creation_Date &&
          new Date(t.Creation_Date).toISOString().slice(0, 10) ===
            creationDateFilter
      );
    }

    // deadline-date filter
    if (deadlineDateFilter) {
      data = data.filter(
        (t) =>
          t.Expected_Completion_Date &&
          new Date(t.Expected_Completion_Date).toISOString().slice(0, 10) ===
            deadlineDateFilter
      );
    }

    if (sortConfig.key) {
      data = [...data].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // normalize null/undefined
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // if both look like dates, compare as dates
        const maybeDateA = Date.parse(aVal);
        const maybeDateB = Date.parse(bVal);
        if (!isNaN(maybeDateA) && !isNaN(maybeDateB)) {
          return sortConfig.direction === "asc"
            ? maybeDateA - maybeDateB
            : maybeDateB - maybeDateA;
        }

        // else compare as strings
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
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
    creationDateFilter,
    deadlineDateFilter,
    sortConfig,
  ]);

  const handleModalSubmit = async () => {
    try {
      const updatedTicketData = {
        Ticket_Number: selectedTicket.Ticket_Number,
        Expected_Completion_Date: updatedExpectedDate,
        Ticket_Priority: updatedPriority,
        TStatus: updatedStatus,
        Assignee_Dept: updatedAssigneeDept,
        Assignee_SubDept: updatedAssigneeSubDept,
        Assignee_EmpID: updatedAssigneeEmpID,
      };
      await axios.post(`${API_BASE_URL}/api/update-ticket`, updatedTicketData);

      // Update the tickets state
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.Ticket_Number === selectedTicket.Ticket_Number
            ? {
                ...ticket,
                Expected_Completion_Date: updatedExpectedDate,
                Ticket_Priority: updatedPriority,
                TStatus: updatedStatus,
                Assignee_Dept: updatedAssigneeDept,
                Assignee_SubDept: updatedAssigneeSubDept,
                Assignee_EmpID: updatedAssigneeEmpID,
              }
            : ticket
        )
      );
      setShowModal(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  return (
    <div>
      <Container>
        <Sidebar activeTab="User Profile" />
        <Content>
          <CreateTicketButton onClick={handleCreateTicket}>
            Create Ticket
          </CreateTicketButton>
          <WelcomeText>Welcome Back {userData.EmpName}!</WelcomeText>
          <EmployeeDetails>
            Employee ID: {userData.EmpID}
            <br />
            Department: {userData.Dept}
            <br />
            Location: {userData.EmpLocation}
          </EmployeeDetails>

          <StatusCardGroup>
            <StatusCardContainer>
              {statusDataState.map((status) => (
                <StatusCard
                  key={status.key}
                  active={statusFilter === status.key}
                  onClick={() => setStatusFilter(status.key)}
                >
                  <StatusTitle>{status.title}</StatusTitle>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <StatusCount>{status.count || 0}</StatusCount>+
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#777",
                        marginTop: "5px",
                      }}
                    >
                      {status.todayCount} new today
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
                placeholder="Search Your Tickets"
                value={searchTerm}
                onChange={handleSearch}
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
              <Button
                active={true}
                onClick={() => handleViewModeChange("assignedByMe")}
              >
                My Tickets
              </Button>
            )}
          </ButtonGroup>

          <Table>
            <thead>
              <tr>
                <TableHeader onClick={() => handleSort("Ticket_Number")}>
                  Ticket#
                  {sortConfig.key === "Ticket_Number"
                    ? sortConfig.direction === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </TableHeader>
                {/* Creation Date */}
                <TableHeader onClick={() => handleSort("Creation_Date")}>
                  Creation Date{" "}
                  {sortConfig.key === "Creation_Date"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                  <br />
                  <Input
                    type="date"
                    value={creationDateFilter}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setCreationDateFilter(e.target.value)}
                    style={{ fontSize: 12, marginTop: 4 }}
                  />
                </TableHeader>

                <TableHeader>Ticket Title</TableHeader>
                <TableHeader onClick={() => handleSort("Ticket_Priority")}>
                  Priority
                  {sortConfig.key === "Ticket_Priority"
                    ? sortConfig.direction === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </TableHeader>
                <TableHeader
                  onClick={() => handleSort("Incident_Reported_Date")}
                >
                  Incident Date
                  {sortConfig.key === "Incident_Reported_Date"
                    ? sortConfig.direction === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </TableHeader>

                <TableHeader
                  onClick={() => handleSort("Incident_Reported_Time")}
                >
                  Incident Time
                  {sortConfig.key === "Incident_Reported_Time"
                    ? sortConfig.direction === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </TableHeader>
                <TableHeader>
                  {viewMode === "assignedToMe" ? "Assigned By" : "Assigned To"}
                </TableHeader>
                {/* Deadline */}
                <TableHeader
                  onClick={() => handleSort("Expected_Completion_Date")}
                >
                  Deadline{" "}
                  {sortConfig.key === "Expected_Completion_Date"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                  <br />
                  <Input
                    type="date"
                    value={deadlineDateFilter}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDeadlineDateFilter(e.target.value)}
                    style={{ fontSize: 12, marginTop: 4 }}
                  />
                </TableHeader>
                <TableHeader>Status</TableHeader>
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
                        emailUser: `${localStorage.getItem(
                          "username"
                        )}@premierenergies.com`,
                      },
                    })
                  }
                >
                  <TableData>{ticket.Ticket_Number}</TableData>
                  <TableData>
                    {ticket.Creation_Date
                      ? new Date(ticket.Creation_Date)
                          .toISOString()
                          .split("T")[0]
                      : "N/A"}
                  </TableData>
                  <TableData>{ticket.Ticket_Title}</TableData>
                  <TableData>{ticket.Ticket_Priority}</TableData>
                  <TableData>
                    {ticket.Incident_Reported_Date
                      ? new Date(ticket.Incident_Reported_Date)
                          .toISOString()
                          .split("T")[0]
                      : "N/A"}
                  </TableData>
                  <TableData>
                    {ticket.Incident_Reported_Time
                      ? ticket.Incident_Reported_Time.slice(11, 16)
                      : "N/A"}
                  </TableData>
                  <TableData>
                    {viewMode === "assignedToMe"
                      ? ticket.Reporter_Name
                      : ticket.Assignee_Name}{" "}
                  </TableData>
                  <TableData>
                    {ticket.TStatus === "Closed" ||
                    ticket.TStatus === "Resolved"
                      ? "Closed"
                      : ticket.Expected_Completion_Date
                      ? (() => {
                          const expectedDate = new Date(
                            ticket.Expected_Completion_Date
                          );
                          const currentDate = new Date();
                          expectedDate.setHours(0, 0, 0, 0);
                          currentDate.setHours(0, 0, 0, 0);
                          const daysDiff = Math.ceil(
                            (expectedDate - currentDate) / (1000 * 60 * 60 * 24)
                          );
                          if (daysDiff > 0)
                            return `In ${daysDiff} day${
                              daysDiff !== 1 ? "s" : ""
                            }`;
                          if (daysDiff === 0) return "Today";
                          return `Overdue by ${Math.abs(daysDiff)} day${
                            Math.abs(daysDiff) !== 1 ? "s" : ""
                          }`;
                        })()
                      : "N/A"}
                  </TableData>
                  <TableData>{ticket.TStatus}</TableData>
                  <TableData>
                    <ActionIcon />
                  </TableData>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Modal */}
          {showModal && selectedTicket && (
            <ModalOverlay>
              <ModalContent>
                <ModalHeader>
                  <h2>Ticket Details</h2>
                  <CloseButton onClick={() => setShowModal(false)}>
                    ×
                  </CloseButton>
                </ModalHeader>
                <ModalBody>
                  {/* Display ticket details */}
                  <DetailRow>
                    <strong>Ticket Number:</strong>{" "}
                    {selectedTicket.Ticket_Number}
                  </DetailRow>
                  <DetailRow>
                    <strong>Creation Date:</strong>{" "}
                    {selectedTicket.Creation_Date}
                  </DetailRow>
                  <DetailRow>
                    <strong>Ticket Title:</strong> {selectedTicket.Ticket_Title}
                  </DetailRow>
                  <DetailRow>
                    <strong>Description:</strong>{" "}
                    {selectedTicket.Ticket_Description}
                  </DetailRow>
                  <DetailRow>
                    <strong>Ticket Type:</strong> {selectedTicket.Ticket_Type}
                  </DetailRow>
                  <DetailRow>
                    <strong>Sub Task:</strong> {selectedTicket.Sub_Task}
                  </DetailRow>
                  <DetailRow>
                    <strong>Task Label:</strong> {selectedTicket.Task_Label}
                  </DetailRow>
                  <DetailRow>
                    <strong>Ticket Priority:</strong>{" "}
                    {selectedTicket.Ticket_Priority}
                  </DetailRow>
                  <DetailRow>
                    <strong>Assignee Department:</strong>{" "}
                    {selectedTicket.Assignee_Dept}
                  </DetailRow>
                  <DetailRow>
                    <strong>Assignee SubDept:</strong>{" "}
                    {selectedTicket.Assignee_SubDept}
                  </DetailRow>
                  <DetailRow>
                    <strong>Assignee Employee ID:</strong>{" "}
                    {selectedTicket.Assignee_EmpID}
                  </DetailRow>
                  <DetailRow>
                    <strong>Reporter Location:</strong>{" "}
                    {selectedTicket.Reporter_Location}
                  </DetailRow>
                  <DetailRow>
                    <strong>Reporter Department:</strong>{" "}
                    {selectedTicket.Reporter_Department}
                  </DetailRow>
                  <DetailRow>
                    <strong>Reporter Employee ID:</strong>{" "}
                    {selectedTicket.Reporter_EmpID}
                  </DetailRow>
                  <DetailRow>
                    <strong>Reporter Name:</strong>{" "}
                    {selectedTicket.Reporter_Name}
                  </DetailRow>
                  <DetailRow>
                    <strong>Reporter Email:</strong>{" "}
                    {selectedTicket.Reporter_Email}
                  </DetailRow>
                  <DetailRow>
                    <strong>Status:</strong> {selectedTicket.TStatus}
                  </DetailRow>

                  {/* Editable fields */}
                  <FormRow>
                    <Label>Status:</Label>
                    <Select
                      value={updatedStatus}
                      onChange={(e) => setUpdatedStatus(e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </Select>
                  </FormRow>

                  <FormRow>
                    <Label>Assignee Department:</Label>
                    <Select
                      value={updatedAssigneeDept}
                      onChange={(e) => setUpdatedAssigneeDept(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {assigneeDepts.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                  </FormRow>

                  <FormRow>
                    <Label>Assignee SubDept:</Label>
                    <Select
                      value={updatedAssigneeSubDept}
                      onChange={(e) =>
                        setUpdatedAssigneeSubDept(e.target.value)
                      }
                      disabled={!updatedAssigneeDept}
                    >
                      <option value="">Select SubDept</option>
                      {assigneeSubDepts.map((subDept) => (
                        <option key={subDept} value={subDept}>
                          {subDept}
                        </option>
                      ))}
                    </Select>
                  </FormRow>

                  <FormRow>
                    <Label>Assignee Employee:</Label>
                    <Select
                      value={updatedAssigneeEmpID}
                      onChange={(e) => setUpdatedAssigneeEmpID(e.target.value)}
                      disabled={!updatedAssigneeSubDept}
                    >
                      <option value="">Select Employee</option>
                      {assigneeEmpIDs.map((emp) => (
                        <option key={emp.EmpID} value={emp.EmpID}>
                          {emp.EmpName}
                        </option>
                      ))}
                    </Select>
                  </FormRow>

                  <FormRow>
                    <Label>Expected Completion Date:</Label>
                    <Input
                      type="date"
                      value={updatedExpectedDate}
                      onChange={(e) => setUpdatedExpectedDate(e.target.value)}
                    />
                  </FormRow>
                  <FormRow>
                    <Label>Priority:</Label>
                    <Select
                      value={updatedPriority}
                      onChange={(e) => setUpdatedPriority(e.target.value)}
                    >
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </Select>
                  </FormRow>
                </ModalBody>
                <ModalFooter>
                  <SubmitButton onClick={handleModalSubmit}>
                    Submit
                  </SubmitButton>
                  <CancelButton onClick={() => setShowModal(false)}>
                    Cancel
                  </CancelButton>
                </ModalFooter>
              </ModalContent>
            </ModalOverlay>
          )}
        </Content>
      </Container>
    </div>
  );
};

export default Dashboard;
