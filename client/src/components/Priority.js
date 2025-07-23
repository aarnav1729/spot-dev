import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = window.location.origin;
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #ffffff;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
`;

const Title = styled.h1`
  color: #f57c00;
  font-size: 36px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: bold;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 25px;
  padding: 10px 20px;
  width: 25%;
  margin-right: 20px;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 16px;
  color: #0f6ab0;
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
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  border-bottom: 2px solid #000000;
  padding: 10px;
  text-align: left;
  background-color: #f0f0f0;
`;

const TableData = styled.td`
  border-bottom: 1px solid #cccccc;
  padding: 10px;
`;

const PriorityStar = styled.span`
  color: gold;
  font-size: 20px;
  cursor: pointer;
`;

const CreateTicketButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #61b847;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;
`;

const Priority = () => {
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("assignedByMe");
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();

  const handleCreateTicket = () => {
    const username = localStorage.getItem("username");
    navigate("/ticket", { state: { username } });
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
          navigate("/login");
          return;
        }

        // Fetch user data if not already fetched
        if (!userData.EmpID) {
          const userResponse = await axios.get(
            `${API_BASE_URL}/api/user`,
            {
              params: { email: storedUsername },
            }
          );
          setUserData(userResponse.data);
          return; // Return here so that userData updates and triggers another useEffect run
        }

        // Fetch tickets based on viewMode
        const response = await axios.get(`${API_BASE_URL}/api/tickets`, {
          params: {
            mode: viewMode,
            empID: userData.EmpID,
          },
        });

        const allTickets = response.data.tickets;

        // Filter tickets by priority = High
        const highPriorityTickets = allTickets.filter(
          (ticket) => ticket.Ticket_Priority === "High"
        );

        // Map the tickets to a structure similar to what the component expects
        const formattedTasks = highPriorityTickets.map((ticket) => {
          let deadlineText = "N/A";
          if (ticket.Expected_Completion_Date) {
            const expectedDate = new Date(ticket.Expected_Completion_Date);
            const currentDate = new Date();

            expectedDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            const timeDiff = expectedDate - currentDate;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            if (daysDiff > 0) {
              deadlineText = `In ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`;
            } else if (daysDiff === 0) {
              deadlineText = "Today";
            } else {
              deadlineText = `Overdue by ${Math.abs(daysDiff)} day${
                Math.abs(daysDiff) !== 1 ? "s" : ""
              }`;
            }
          }

          return {
            creationDate: ticket.Creation_Date
              ? new Date(ticket.Creation_Date).toISOString().split("T")[0]
              : "N/A",
            title: ticket.Ticket_Title,
            priority: ticket.Ticket_Priority,
            assignedBy: ticket.Reporter_Name || "N/A",
            deadline: deadlineText,
          };
        });

        setPriorityTasks(formattedTasks);
      } catch (error) {
        console.error("Error fetching high priority tasks:", error);
      }
    };

    fetchData();
  }, [navigate, viewMode, userData]);

  // Filter tasks based on search input
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTasks(priorityTasks);
      return;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = priorityTasks.filter((task) =>
      Object.values(task).some(
        (value) =>
          value &&
          typeof value === "string" &&
          value.toLowerCase().includes(lowercasedSearchTerm)
      )
    );

    setFilteredTasks(filtered);
  }, [searchTerm, priorityTasks]);

  return (
    <div>
      <Container>
        <Sidebar activeTab="Priority Tasks" />
        <Content>
          <CreateTicketButton onClick={handleCreateTicket}>
            Create Ticket
          </CreateTicketButton>
          <Title>Priority Tasks</Title>
          <ButtonGroup>
            <SearchBar>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search Priority Tickets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBar>
            <Button
              active={viewMode === "assignedByMe"}
              onClick={() => handleViewModeChange("assignedByMe")}
            >
              Assigned by Me
            </Button>
            <Button
              active={viewMode === "assignedToMe"}
              onClick={() => handleViewModeChange("assignedToMe")}
            >
              Assigned to Me
            </Button>
          </ButtonGroup>
          <Table>
            <thead>
              <tr>
                <TableHeader>Creation Date</TableHeader>
                <TableHeader>Ticket Name</TableHeader>
                <TableHeader>Priority</TableHeader>
                <TableHeader>Assigned By</TableHeader>
                <TableHeader>Deadline</TableHeader>
                <TableHeader></TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr key={index}>
                  <TableData>{task.creationDate}</TableData>
                  <TableData>{task.title}</TableData>
                  <TableData>{task.priority}</TableData>
                  <TableData>{task.assignedBy}</TableData>
                  <TableData>{task.deadline}</TableData>
                  <TableData>
                    <PriorityStar>&#9733;</PriorityStar>
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

export default Priority;