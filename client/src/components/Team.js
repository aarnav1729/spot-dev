// Team.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// ——————— YOUR STATIC IT ORG CHART DEFINITION ———————
const IT_ORG = {
  EmpID: "PSS1431",
  EmpName: "Tangirala Ramesh",
  EmpEmail: "ramesh.t@premierenergies.com",
  title: "General Manager - Systems & Infrastructure",
  children: [
    {
      EmpID: "PEPPL0604",
      EmpName: "Bandarupalli Krishna Chaitanya",
      EmpEmail: "krishnachaitanya.b@premierenergies.com",
      title: "Deputy Manager - IT",
      children: [
        {
          EmpID: "PEIPL0106",
          EmpName: "Samrat Vura",
          EmpEmail: "samrat.vura@premierenergies.com",
          title: "Deputy Manager",
          children: [],
        },
        {
          EmpID: "PEIPL0441",
          EmpName: "Shaik Gulam Ahamed",
          EmpEmail: "p4.it@premierenergies.com",
          title: "Engineer",
          children: [],
        },
        // note: Madhav Sai moved under Kishore below
      ],
    },
    {
      EmpID: "PEPPL0741",
      EmpName: "Raj Kumar Nalli",
      EmpEmail: "rajkumar.n@premierenergies.com",
      title: "SAP Functional Consultant",
      children: [],
    },
    {
      EmpID: "PEPPL0874",
      EmpName: "Aarnav Singh",
      EmpEmail: "aarnav.singh@premierenergies.com",
      title: "Senior Executive",
      children: [],
    },
    {
      EmpID: "PSS1234",
      EmpName: "Kishore Kumar Kundeti",
      EmpEmail: "kishorekundeti@premierenergies.com",
      title: "Deputy Manager - IT",
      children: [
        {
          EmpID: "PEIPL0480",
          EmpName: "Kalakoti Madhav Sai",
          EmpEmail: "madhav.k@premierenergies.com",
          title: "Junior Executive - IT",
          children: [],
        },
      ],
    },
    {
      EmpID: "PSS1396",
      EmpName: "Pulla Suneel Kumar",
      EmpEmail: "Suneel.p@premierenergies.com",
      title: "Sr. Executive",
      children: [],
    },
  ],
};

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

// draw the vertical connector
const TreeNode = styled.div`
  position: relative;
  margin-left: ${({ level }) => level * 20}px;
  padding-left: 20px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 50%;
    left: 10px;
    border-left: ${({ level }) =>
      level > 0 ? "1px solid #ccc" : "none"};
  }
`;

const TeamMemberCard = styled.div`
  position: relative;
  display: inline-block;
  background: linear-gradient(135deg, #ffebee 0%, #e3f2fd 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  white-space: nowrap;
  margin-bottom: 10px;
  cursor: ${({ clickable }) => (clickable ? "pointer" : "default")};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  /* horizontal connector */
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: -20px;
    width: 20px;
    border-top: 1px solid #ccc;
  }

  &:hover {
    ${({ clickable }) =>
      clickable &&
      `
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    `}
  }
`;

const TeamMemberName = styled.h3`
  color: #d32f2f;
  font-size: 18px;
  margin: 0 0 4px;
`;

const TeamMemberDetails = styled.p`
  color: #388e3c;
  font-size: 12px;
  margin: 0;
`;

const TicketCount = styled.div`
  font-size: 12px;
  margin-top: 4px;
  color: #555;
`;

// Modal styles...
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
  const [ticketCounts, setTicketCounts] = useState({});
  const [userDept, setUserDept] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // 1) load user dept & ticket counts
  useEffect(() => {
    (async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) return;
        const { data: user } = await axios.get(
          `${API_BASE_URL}/api/user`,
          { params: { email: storedUsername } }
        );
        setUserDept(user.Dept);

        // collect all EmpIDs
        const allIDs = [];
        (function collect(n) {
          allIDs.push(n.EmpID);
          n.children.forEach(collect);
        })(IT_ORG);

        const promises = allIDs.map((empID) =>
          axios
            .get(`${API_BASE_URL}/api/tickets`, {
              params: { mode: "assignedToMe", empID },
            })
            .then((res) => {
              const open = (res.data.tickets || []).filter(
                (t) =>
                  !t.TStatus ||
                  !["closed", "resolved"].includes(
                    t.TStatus.toLowerCase()
                  )
              );
              return { empID, count: open.length };
            })
        );
        const results = await Promise.all(promises);
        setTicketCounts(
          results.reduce(
            (acc, { empID, count }) => ((acc[empID] = count), acc),
            {}
          )
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // 2) open modal for that person's tickets
  const openModal = async (emp) => {
    if (userDept !== "IT") return;
    setSelected(emp);
    setTicketsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode: "assignedToMe", empID: emp.EmpID },
      });
      const open = (res.data.tickets || []).filter(
        (t) =>
          !t.TStatus ||
          !["closed", "resolved"].includes(
            t.TStatus.toLowerCase()
          )
      );
      setTickets(open);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };
  const closeModal = () => {
    setSelected(null);
    setTickets([]);
  };

  // 3) reassign
  const reassignToMe = async (ticketNumber) => {
    const rawEmp = localStorage.getItem("empID");
    const rawEmail = localStorage.getItem("username");
    if (!rawEmp || !rawEmail) {
      return alert("Session expired—please log in again.");
    }
    const UserID = rawEmail.includes("@")
      ? rawEmail
      : `${rawEmail}@premierenergies.com`;
    try {
      const { data: details } = await axios.get(
        `${API_BASE_URL}/api/ticket-details`,
        { params: { ticketNumber } }
      );
      const payload = {
        ...details,
        Assignee_EmpID: rawEmp,
        UserID,
        Comment: "Reassigned via Team page",
      };
      await axios.post(
        `${API_BASE_URL}/api/update-ticket`,
        payload
      );
      setTickets((tks) =>
        tks.filter((t) => t.Ticket_Number !== ticketNumber)
      );
    } catch (err) {
      alert(
        "Reassign failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // 4) render tree
  const renderNode = (node, level = 0) => (
    <TreeNode key={node.EmpID} level={level}>
      <TeamMemberCard
        clickable={userDept === "IT"}
        onClick={() => openModal(node)}
      >
        <TeamMemberName>{node.EmpName}</TeamMemberName>
        <TeamMemberDetails>{node.title}</TeamMemberDetails>
        <TicketCount>
          {ticketCounts[node.EmpID] ?? 0} open ticket
          {(ticketCounts[node.EmpID] ?? 0) !== 1 ? "s" : ""}
        </TicketCount>
      </TeamMemberCard>
      {node.children.map((ch) => renderNode(ch, level + 1))}
    </TreeNode>
  );

  return (
    <Container>
      <Sidebar activeTab="Team Structure" />
      <Content>
        <Title>IT Department Org Chart</Title>
        {renderNode(IT_ORG)}
      </Content>

      {selected && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent
            onClick={(e) => e.stopPropagation()}
          >
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
                    {userDept === "IT" && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.Ticket_Number}>
                      <td>{t.Ticket_Number}</td>
                      <td>{t.Ticket_Title}</td>
                      <td>{t.TStatus}</td>
                      {userDept === "IT" && (
                        <td>
                          <ReassignBtn
                            onClick={() =>
                              reassignToMe(t.Ticket_Number)
                            }
                          >
                            Reassign to me
                          </ReassignBtn>
                        </td>
                      )}
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
