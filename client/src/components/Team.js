// Team.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";

const API_BASE_URL = window.location.origin;

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #e8f5e9;
  overflow: auto;
`;
const Content = styled.div`
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  background: linear-gradient(135deg, #f3f9fd 0%, #ffffff 100%);
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
`;
const Title = styled.h1`
  color: #0f6ab0;
  font-size: 36px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: bold;
`;
const ChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 40px;
`;
const TeamMemberCard = styled.div`
  background: linear-gradient(135deg, #ffebee 0%, #e3f2fd 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 180px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;
const TeamMemberName = styled.h3`
  color: #d32f2f;
  font-size: 22px;
  margin-bottom: 15px;
  font-weight: bold;
`;
const TeamMemberDetails = styled.p`
  color: #388e3c;
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 500;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #fff; border-radius: 8px;
  width: 600px; max-height: 80vh; overflow: auto;
  padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
`;
const CloseBtn = styled.button`
  background: transparent; border: none;
  font-size: 1.5rem; cursor: pointer;
`;
const TicketTable = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #f5f5f5; }
`;
const ReassignBtn = styled.button`
  background: #0f6ab0; color: #fff; border: none;
  padding: 6px 12px; border-radius: 4px; cursor: pointer;
  &:hover { background: #085a92; }
`;

export default function Team() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const empID = localStorage.getItem("empID");
      if (!empID) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/team-structure`,
          { params: { empID } }
        );
        setEmployees(data.employees || []);
      } catch (e) {
        console.error("Error loading team structure:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openModal = async (emp) => {
    setSelected(emp);
    setTicketsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode: "assignedToMe", empID: emp.EmpID },
      });
      const openTickets = (res.data.tickets || []).filter(
        (t) =>
          !t.TStatus ||
          !["closed", "resolved"].includes(t.TStatus.toLowerCase())
      );
      setTickets(openTickets);
    } catch (e) {
      console.error("Error fetching tickets:", e);
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setTickets([]);
  };

  const reassignToMe = async (ticketNumber) => {
    const rawEmp = localStorage.getItem("empID");
    const empIdNum = parseInt(rawEmp, 10);
    if (!rawEmp) {
      alert("Session expired—please log in again.");
      return;
    }

    const rawEmail =
      localStorage.getItem("username") || localStorage.getItem("email");
    if (!rawEmail) {
      alert("Unable to find your user email—please log in again.");
      return;
    }
    const UserID = rawEmail.includes("@")
      ? rawEmail
      : `${rawEmail}@premierenergies.com`;

    try {
      // 1) fetch the full ticket
      const { data: details } = await axios.get(
        `${API_BASE_URL}/api/ticket-details`,
        { params: { ticketNumber } }
      );

      // 2) build an explicit payload (overwriting only the assignee fields)
      const payload = {
        Ticket_Number: details.Ticket_Number,
        Expected_Completion_Date: details.Expected_Completion_Date,
        Ticket_Priority: details.Ticket_Priority,
        TStatus: details.TStatus,
        Assignee_Dept: details.Assignee_Dept,
        Assignee_SubDept: details.Assignee_SubDept,
        Assignee_EmpID: rawEmp,
        IT_Incident_Date: details.IT_Incident_Date,
        IT_Incident_Time: details.IT_Incident_Time,
        IT_Ack_Flag: details.IT_Ack_Flag,
        IT_Ack_Timestamp: details.IT_Ack_Timestamp,
        UserID,
        Comment: "Reassigned via Team page",
      };

      // 3) call update
      await axios.post(`${API_BASE_URL}/api/update-ticket`, payload);

      // 4) remove from UI list
      setTickets((tks) =>
        tks.filter((t) => t.Ticket_Number !== ticketNumber)
      );
    } catch (err) {
      console.error("Reassign failed:", err.response?.data || err);
      alert(
        "Reassign failed: " +
          (err.response?.data?.message || err.message || "Server error")
      );
    }
  };

  if (loading) {
    return (
      <Container>
        <Sidebar activeTab="Team Structure" />
        <Content>
          <Title>Loading Team Structure…</Title>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Sidebar activeTab="Team Structure" />
      <Content>
        <Title>Team Structure</Title>
        <ChartContainer>
          {employees.length > 0 ? (
            employees.map((emp) => (
              <TeamMemberCard
                key={emp.EmpID}
                onClick={() => openModal(emp)}
              >
                <TeamMemberName>{emp.EmpName}</TeamMemberName>
                <TeamMemberDetails>
                  Employee ID: {emp.EmpID}
                </TeamMemberDetails>
              </TeamMemberCard>
            ))
          ) : (
            <p>No employees found in your department.</p>
          )}
        </ChartContainer>
      </Content>

      {selected && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>{selected.EmpName}’s Open Tickets</h2>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>

            {ticketsLoading ? (
              <p>Loading tickets…</p>
            ) : tickets.length === 0 ? (
              <p>No open tickets.</p>
            ) : (
              <TicketTable>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.Ticket_Number}>
                      <td>{t.Ticket_Number}</td>
                      <td>{t.Ticket_Title}</td>
                      <td>{t.TStatus}</td>
                      <td>
                        <ReassignBtn
                          onClick={() => reassignToMe(t.Ticket_Number)}
                        >
                          Reassign to me
                        </ReassignBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TicketTable>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
