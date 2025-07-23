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
      ],
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

// Main chart wrapper, relative so SVG lines overlay correctly
const Chart = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 200px; /* give space for bottom row */
`;
const MiddleRow = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 80px; /* place managers below root */
`;
const BottomRow = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  position: absolute;
  bottom: 0;
`;
const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// SVG overlay for root → managers connectors
const ConnectorSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

// generic CSS connector for manager’s own reportees and bottom row
const CssConnector = styled.div`
  width: 2px;
  height: ${({ length }) => length || "30px"};
  background: #ccc;
  margin: 0 auto;
`;

const TeamMemberCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, #ffebee 0%, #e3f2fd 100%);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  white-space: nowrap;
  cursor: ${({ clickable }) => (clickable ? "pointer" : "default")};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    ${({ clickable }) =>
      clickable &&
      `
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    `}
  }

  /* bottom-row items: draw horizontal line up from top center */
  &.bottom::before {
    content: "";
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 30px;
    background: #ccc;
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

// Modal…
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

  // 1) fetch user dept & ticket counts
  useEffect(() => {
    (async () => {
      try {
        const email = localStorage.getItem("username");
        if (!email) return;
        const { data: user } = await axios.get(
          `${API_BASE_URL}/api/user`,
          { params: { email } }
        );
        setUserDept(user.Dept);

        // gather all EmpIDs
        const allIDs = [];
        (function collect(n) {
          allIDs.push(n.EmpID);
          n.children.forEach(collect);
        })(IT_ORG);

        // fetch counts
        const promises = allIDs.map(empID =>
          axios.get(`${API_BASE_URL}/api/tickets`, {
            params: { mode: "assignedToMe", empID },
          }).then(res => ({
            empID,
            count: (res.data.tickets || []).filter(
              t => !t.TStatus ||
                   !["closed","resolved"].includes(t.TStatus.toLowerCase())
            ).length,
          }))
        );
        const results = await Promise.all(promises);
        const counts = {};
        results.forEach(r => counts[r.empID] = r.count);
        setTicketCounts(counts);
      } catch (err) {
        console.error("Error loading counts", err);
      }
    })();
  }, []);

  // 2) modal open
  const openModal = async emp => {
    if (userDept !== "IT") return;
    setSelected(emp);
    setTicketsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets`, {
        params: { mode: "assignedToMe", empID: emp.EmpID },
      });
      const open = (res.data.tickets || []).filter(
        t => !t.TStatus ||
             !["closed","resolved"].includes(t.TStatus.toLowerCase())
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
  const reassignToMe = async ticketNumber => {
    const rawEmp = localStorage.getItem("empID");
    const rawEmail = localStorage.getItem("username");
    if (!rawEmp || !rawEmail) {
      return alert("Session expired—please log in again.");
    }
    const UserID = rawEmail.includes("@") ? rawEmail : rawEmail + "@premierenergies.com";
    try {
      const { data: details } = await axios.get(
        `${API_BASE_URL}/api/ticket-details`,
        { params: { ticketNumber } }
      );
      await axios.post(`${API_BASE_URL}/api/update-ticket`, {
        ...details,
        Assignee_EmpID: rawEmp,
        UserID,
        Comment: "Reassigned via Team page",
      });
      setTickets(t => t.filter(x => x.Ticket_Number !== ticketNumber));
    } catch (err) {
      alert("Reassign failed: " + (err.response?.data?.message || err.message));
    }
  };

  // split out first two as managers, rest as bottom
  const [mgrA, mgrB, ...others] = IT_ORG.children;

  return (
    <Container>
      <Sidebar activeTab="Team Structure" />
      <Content>
        <Title>IT Department Org Chart</Title>
        <Chart>

          {/* SVG connectors from Ramesh down to both managers */}
          <ConnectorSvg>
            <defs>
              <marker
                id="arrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill="#ccc" />
              </marker>
            </defs>
            {/* line to Krishna (25% across, ~120px down) */}
            <line
              x1="50%"
              y1="40px"
              x2="25%"
              y2="140px"
              stroke="#ccc"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            {/* line to Kishore (75% across, ~140px down) */}
            <line
              x1="50%"
              y1="40px"
              x2="75%"
              y2="140px"
              stroke="#ccc"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          </ConnectorSvg>

          {/* Ramesh */}
          <TeamMemberCard clickable={false} style={{ margin: "0 auto" }}>
            <TeamMemberName>{IT_ORG.EmpName}</TeamMemberName>
            <TeamMemberDetails>{IT_ORG.title}</TeamMemberDetails>
            <TicketCount>
              {ticketCounts[IT_ORG.EmpID] || 0} open incidents
              {(ticketCounts[IT_ORG.EmpID] || 0) !== 1 && "s"}
            </TicketCount>
          </TeamMemberCard>

          {/* two direct managers */}
          <MiddleRow>
            {[mgrA, mgrB].map(m => (
              <Column key={m.EmpID}>
                <TeamMemberCard
                  clickable={userDept === "IT"}
                  onClick={() => openModal(m)}
                >
                  <TeamMemberName>{m.EmpName}</TeamMemberName>
                  <TeamMemberDetails>{m.title}</TeamMemberDetails>
                  <TicketCount>
                    {ticketCounts[m.EmpID] || 0} open incidents
                    {(ticketCounts[m.EmpID] || 0) !== 1 && "s"}
                  </TicketCount>
                </TeamMemberCard>

                {/* manager’s own reportees */}
                {m.children.map(c => (
                  <React.Fragment key={c.EmpID}>
                    <CssConnector length="20px" />
                    <TeamMemberCard
                      clickable={userDept === "IT"}
                      onClick={() => openModal(c)}
                    >
                      <TeamMemberName>{c.EmpName}</TeamMemberName>
                      <TeamMemberDetails>{c.title}</TeamMemberDetails>
                      <TicketCount>
                        {ticketCounts[c.EmpID] || 0} open incidents
                        {(ticketCounts[c.EmpID] || 0) !== 1 && "s"}
                      </TicketCount>
                    </TeamMemberCard>
                  </React.Fragment>
                ))}
              </Column>
            ))}
          </MiddleRow>

          {/* bottom row — remaining direct reportees */}
          <BottomRow>
            {others.map(o => (
              <TeamMemberCard
                key={o.EmpID}
                clickable={userDept === "IT"}
                onClick={() => openModal(o)}
                className="bottom"
              >
                <TeamMemberName>{o.EmpName}</TeamMemberName>
                <TeamMemberDetails>{o.title}</TeamMemberDetails>
                <TicketCount>
                  {ticketCounts[o.EmpID] || 0} open incidents
                  {(ticketCounts[o.EmpID] || 0) !== 1 && "s"}
                </TicketCount>
              </TeamMemberCard>
            ))}
          </BottomRow>
        </Chart>
      </Content>

      {/* Modal for open tickets */}
      {selected && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>{selected.EmpName}’s Open incidents</h2>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>
            {ticketsLoading ? (
              <p>Loading incidents...</p>
            ) : tickets.length === 0 ? (
              <p>No open incidents.</p>
            ) : (
              <TicketTable>
                <thead>
                  <tr>
                    <th>Incident #</th>
                    <th>Title</th>
                    <th>Status</th>
                    {userDept === "IT" && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.Ticket_Number}>
                      <td>{t.Ticket_Number}</td>
                      <td>{t.Ticket_Title}</td>
                      <td>{t.TStatus}</td>
                      {userDept === "IT" && (
                        <td>
                          <ReassignBtn
                            onClick={() => reassignToMe(t.Ticket_Number)}
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
