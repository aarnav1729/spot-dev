import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaArrowRight, FaArrowUp, FaArrowDown } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// Helper function to fix reporter name duplication.
// Updated to ensure the input is treated as a string.
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

// Styled components (identical to Profile.js)

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
`;

const StatusCard = styled.div`
  background-color: #ffffff;
  color: #000;
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
  const [filteredTickets, setFilteredTickets] = useState([]); // To store filtered tickets
  const [searchTerm, setSearchTerm] = useState(""); // To store search input
  const [statusCounts, setStatusCounts] = useState({});
  const [viewMode, setViewMode] = useState("assignedByDept");
  const [statusDataState, setStatusDataState] = useState([]);

  // sorting + date filters
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [creationDateFilter, setCreationDateFilter] = useState("");
  const [deadlineDateFilter, setDeadlineDateFilter] = useState("");

  // Editable fields (if any modal is used)
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [updatedAssigneeDept, setUpdatedAssigneeDept] = useState("");
  const [updatedAssigneeSubDept, setUpdatedAssigneeSubDept] = useState("");
  const [updatedAssigneeEmpID, setUpdatedAssigneeEmpID] = useState("");
  // Dropdown options (if any modal is used)
  const [assigneeDepts, setAssigneeDepts] = useState([]);
  const [assigneeSubDepts, setAssigneeSubDepts] = useState([]);
  const [assigneeEmpIDs, setAssigneeEmpIDs] = useState([]);
  // Modal state (if any)
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatedExpectedDate, setUpdatedExpectedDate] = useState("");
  const [updatedPriority, setUpdatedPriority] = useState("");

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
        // For department dashboard, fetch tickets using the user's department
        fetchTickets("assignedByDept", userResponse.data.Dept);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };
    fetchData();
  }, [navigate]);

  const fetchTickets = async (mode, department) => {
    try {
      // 1. Fetch tickets + counts
      const response = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode, department },
      });

      const tickets = response.data.tickets || [];
      const currentCounts = response.data.statusCounts || {};
      const previousCounts = response.data.previousStatusCounts || {};

      // 2. Store tickets
      setTickets(tickets);
      setFilteredTickets(tickets);

      // 3. Build status template
      const statusTemplate = [
        { key: "total", title: "Total", color: "#FF6F61" },
        { key: "unassigned", title: "Unassigned", color: "#FBC02D" },
        { key: "inProgress", title: "In‑Progress", color: "#4CAF50" },
        { key: "overdue", title: "Overdue", color: "#E53935" },
        { key: "resolved", title: "Resolved", color: "#1E88E5" },
        { key: "closed", title: "Closed", color: "#8E24AA" },
      ];

      // 4. Compute todayCount = current – previous (never negative)
      const updatedStatusData = statusTemplate.map((s) => {
        const count = currentCounts[s.key] || 0;
        const prev = previousCounts[s.key] || 0;
        const todayCount = Math.max(0, count - prev);
        return { ...s, count, todayCount };
      });

      // 5. Update state
      setStatusDataState(updatedStatusData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTickets([]);
      setFilteredTickets([]);
      setStatusDataState([]);
    }
  };

  const handleCreateTicket = () => {
    navigate("/ticket");
  };

  // sort handler
  const handleSort = (key) => {
    setSortConfig((sc) =>
      sc.key === key
        ? { key, direction: sc.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  // combined filter+sort
  const filteredAndSorted = useMemo(() => {
    let data = tickets;

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      data = data.filter((ti) =>
        Object.values(ti).some((v) => ("" + v).toLowerCase().includes(t))
      );
    }
    if (creationDateFilter) {
      data = data.filter(
        (ti) =>
          ti.Creation_Date &&
          new Date(ti.Creation_Date).toISOString().slice(0, 10) ===
            creationDateFilter
      );
    }
    if (deadlineDateFilter) {
      data = data.filter(
        (ti) =>
          ti.Expected_Completion_Date &&
          new Date(ti.Expected_Completion_Date).toISOString().slice(0, 10) ===
            deadlineDateFilter
      );
    }
    if (sortConfig.key) {
      data = [...data].sort((a, b) => {
        let aV = a[sortConfig.key],
          bV = b[sortConfig.key];
        if (!aV) return 1;
        if (!bV) return -1;
        aV = new Date(aV).getTime();
        bV = new Date(bV).getTime();
        return sortConfig.direction === "asc" ? aV - bV : bV - aV;
      });
    }
    return data;
  }, [tickets, searchTerm, creationDateFilter, deadlineDateFilter, sortConfig]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // For department tickets, always use the user's department.
    fetchTickets(mode, userData.Dept);
  };

  const handleActionClick = (ticket) => {
    const storedUsername = localStorage.getItem("username");
    const fullEmailUser = `${storedUsername}@premierenergies.com`;
    navigate(`/ticket/${ticket.Ticket_Number}`, {
      state: { ticket, emailUser: fullEmailUser },
    });
  };

  useEffect(() => {
    setFilteredTickets(tickets);
  }, [tickets]);

  return (
    <div>
      <Container>
        <Sidebar activeTab="Department" />
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
              {statusDataState.map((status, index) => (
                <StatusCard key={index} color={status.color}>
                  <StatusTitle>{status.title}</StatusTitle>
                  <StatusCount>{status.count || 0}</StatusCount>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#777",
                      marginTop: "5px",
                    }}
                  >
                    {status.todayCount} new today
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
                placeholder="Search Department Tickets"
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
                <TableHeader>Ticket Number</TableHeader>
                {/* Creation Date with sort & filter */}
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
                <TableHeader>Priority</TableHeader>
                <TableHeader>
                  {viewMode === "assignedToDept" ? "Assigned By" : "Created By"}
                </TableHeader>
                {/* Deadline with sort & filter */}
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
              {filteredAndSorted.map((t) => (
                <tr
                  key={t.Ticket_Number}
                  onClick={() =>
                    navigate(`/ticket/${t.Ticket_Number}`, {
                      state: {
                        ticket: t,
                        emailUser: `${localStorage.getItem(
                          "username"
                        )}@premierenergies.com`,
                      },
                    })
                  }
                >
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
                  {/* 6. Deadline */}
                  <TableData>
                    {t.TStatus === "Closed" || t.TStatus === "Resolved"
                      ? "Closed"
                      : t.Expected_Completion_Date
                      ? (() => {
                          const ed = new Date(t.Expected_Completion_Date);
                          const today = new Date();
                          ed.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          const diff = Math.ceil(
                            (ed - today) / (1000 * 60 * 60 * 24)
                          );
                          if (diff > 0)
                            return `In ${diff} day${diff !== 1 ? "s" : ""}`;
                          if (diff === 0) return "Today";
                          return `Overdue by ${Math.abs(diff)} day${
                            Math.abs(diff) !== 1 ? "s" : ""
                          }`;
                        })()
                      : "N/A"}
                  </TableData>

                  {/* 7. Status */}
                  <TableData>{t.TStatus}</TableData>
                  <TableData>
                    <ActionIcon />
                  </TableData>
                </tr>
              ))}
            </tbody>
          </Table>
        </Content>
      </Container>
    </div>
  );
};

export default DepartmentDashboard;
