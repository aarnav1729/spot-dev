import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Form, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "axios";
const API_BASE_URL = window.location.origin;

// collapse an exact back‑to‑back duplicate string
const stripDup = (s) => {
  if (typeof s !== "string") return s || "";
  const len = s.length;
  if (len % 2 === 0) {
    const half = len / 2;
    if (s.slice(0, half) === s.slice(half)) {
      return s.slice(0, half);
    }
  }
  return s;
};

// format a date (string or Date) as YYYY‑MM‑DD, or “—”
const formatISODate = (v) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d instanceof Date && !isNaN(d) ? d.toISOString().slice(0, 10) : "—";
};

// format a time string or Date as "HH:MM"
const formatTimeIST = (ts) => {
  if (!ts) return "—";
  // ts might be a Date or an ISO string
  const iso = ts instanceof Date ? ts.toISOString() : ts;
  // grab characters 11–16 ("HH:MM")
  return iso.slice(11, 16);
};

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background: linear-gradient(to bottom right, #f0f4f8, #d9e2ec);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Content = styled.div`
  flex: 1;
  position: relative;
  padding: 40px;
  box-sizing: border-box;
`;

const TicketDetails = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 40px;
  padding-right: ${({ isHistoryVisible }) =>
    isHistoryVisible ? "440px" : "80px"};
  box-sizing: border-box;
  transition: box-shadow 0.3s ease, padding-right 0.3s ease;

  &:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h1`
  color: #222;
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: 700;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  letter-spacing: 0.7px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 40px;
  left: 40px;
  background-color: #0f6ab0;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0d5a8e;
    transform: translateY(-1px);
  }
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  font-size: 16px;
  color: #555;
  line-height: 1.6;

  strong {
    width: 220px;
    color: #333;
    font-weight: 600;
  }

  span {
    flex: 1;
    padding: 10px 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
    font-size: 15px;
    color: #444;
  }
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
`;

const Label = styled.label`
  width: 220px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15, 106, 176, 0.2);
    outline: none;
  }
`;

const Select = styled.select`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15, 106, 176, 0.2);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  height: 120px;
  resize: vertical;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15, 106, 176, 0.2);
    outline: none;
  }
`;

const SubmitButton = styled.button`
  background-color: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 500;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #0d5a8e;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const HistoryPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 360px;
  max-height: calc(100% - 40px);
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform: ${({ visible }) =>
    visible ? "translateX(0)" : "translateX(380px)"};
  z-index: 10;

  &:hover {
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  }
`;

const HistoryTitle = styled.h2`
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
`;

const HistoryItem = styled.div`
  border-bottom: 1px solid #eee;
  padding: 15px 0;
  font-size: 14px;
  line-height: 1.4;

  &:last-child {
    border-bottom: none;
  }

  strong {
    display: inline-block;
    width: 100px;
    color: #555;
    font-weight: 600;
  }

  .history-comment {
    margin-top: 5px;
    font-style: italic;
    color: #666;
  }

  & + & {
    margin-top: 15px;
  }
`;

const HistoryToggleButton = styled.button`
  position: absolute;
  top: 40px;
  right: ${({ visible }) => (visible ? "370px" : "40px")};
  background-color: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: right 0.3s ease, background-color 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #0d5a8e;
  }
`;

// dispute modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;
const ModalContent = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 320px;
`;
const ModalLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  button {
    margin-left: 8px;
  }
`;

/* Helper function to fix reporter name duplication.
   If the name is exactly repeated twice (e.g. "Aarnav SinghAarnav Singh"),
   it returns only the first half. Otherwise, it returns the original name. */
const formatReporterName = (name) => {
  if (!name) return "";
  const len = name.length;
  if (len % 2 === 0) {
    const half = len / 2;
    if (name.slice(0, half) === name.slice(half)) {
      return name.slice(0, half);
    }
  }
  return name;
};

const STicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ticketNum = location.state.ticket.Ticket_Number;

  // Derive user email once
  const rawUser = location.state.emailUser;
  const emailUser = rawUser.includes("@")
    ? rawUser
    : `${rawUser}@premierenergies.com`;

  // ── STATE HOOKS (must always be in the same order) ─────────────────────────
  const [ticket, setTicket] = useState(location.state.ticket);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isHod, setIsHod] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const handleCancelDispute = () => {
    // reset to original if you like:
    setItIncidentDate(ticket.IT_Incident_Date?.slice(0, 10) || "");
    setItIncidentTime(ticket.IT_Incident_Time?.slice(0, 5) || "");
    setShowDisputeModal(false);
  };

  const handleSaveDispute = () => {
    // you could add validation here
    setShowDisputeModal(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ── FIGURE OUT HOD STATUS ─────────────────────────────────────────────
  useEffect(() => {
    // 1) fetch this user’s EmpID
    axios
      .get(`${API_BASE_URL}/api/user`, {
        params: { email: emailUser.split("@")[0] },
      })
      .then((res) => {
        const empID = res.data.EmpID;
        // 2) ask the isHOD endpoint
        return axios.get(`${API_BASE_URL}/api/isHOD`, { params: { empID } });
      })
      .then((res) => {
        setIsHod(res.data.isHOD);
      })
      .catch((err) => console.error("Error checking HOD status:", err));
  }, [rawUser]);

  const [itIncidentDate, setItIncidentDate] = useState(
    ticket.IT_Incident_Date
      ? new Date(ticket.IT_Incident_Date).toISOString().slice(0, 10)
      : ""
  );
  const [itIncidentTime, setItIncidentTime] = useState(
    ticket.IT_Incident_Time ? ticket.IT_Incident_Time.slice(0, 5) : ""
  );
  const [itAckFlag, setItAckFlag] = useState(ticket.IT_Ack_Flag || false);
  const [itAckTimestamp, setItAckTimestamp] = useState(
    ticket.IT_Ack_Timestamp ? ticket.IT_Ack_Timestamp : ""
  );

  const [updatedExpectedDate, setUpdatedExpectedDate] = useState(
    ticket.Expected_Completion_Date
      ? new Date(ticket.Expected_Completion_Date).toISOString().slice(0, 10)
      : ""
  );
  const [updatedPriority, setUpdatedPriority] = useState(
    ticket.Ticket_Priority || ""
  );
  const [updatedStatus, setUpdatedStatus] = useState(ticket.TStatus || "");
  const [updatedAssigneeDept, setUpdatedAssigneeDept] = useState(
    ticket.Assignee_Dept || ""
  );
  const [updatedAssigneeSubDept, setUpdatedAssigneeSubDept] = useState(
    ticket.Assignee_SubDept || ""
  );
  const [updatedAssigneeEmpID, setUpdatedAssigneeEmpID] = useState(
    ticket.Assignee_EmpID || ""
  );
  const [remarks, setRemarks] = useState("");

  const [assigneeDepts, setAssigneeDepts] = useState([]);
  const [assigneeSubDepts, setAssigneeSubDepts] = useState([]);
  const [assigneeEmpIDs, setAssigneeEmpIDs] = useState([]);

  useEffect(() => {
    console.log("▶ Reporter_Name:", ticket.Reporter_Name);
    console.log("▶ Reporter_Email:", ticket.Reporter_Email);
    console.log("▶ Incident_Date:", ticket.Incident_Reported_Date);
    console.log("▶ Incident_Time:", ticket.Incident_Reported_Time);
  }, [ticket]);
  // ── EFFECTS ────────────────────────────────────────────────────────────────

  // Load full ticket + history
  useEffect(() => {
    const loadTicketAndHistory = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/ticket-details`, {
          params: { ticketNumber: ticketNum },
        });
        setTicket({
          ...data,
          Incident_Reported_Date: data.Incident_Reported_Date
            ? new Date(data.Incident_Reported_Date)
            : null,
          IT_Incident_Date: data.IT_Incident_Date,
          IT_Incident_Time: data.IT_Incident_Time,
          IT_Ack_Flag: data.IT_Ack_Flag,
          IT_Ack_Timestamp: data.IT_Ack_Timestamp,
        });
        setItIncidentDate(
          data.IT_Incident_Date ? data.IT_Incident_Date.slice(0, 10) : ""
        );
        setItIncidentTime(
          data.IT_Incident_Time ? data.IT_Incident_Time.slice(0, 5) : ""
        );
        setItAckFlag(data.IT_Ack_Flag);
        setItAckTimestamp(data.IT_Ack_Timestamp);

        const histRes = await axios.get(`${API_BASE_URL}/api/ticket-history`, {
          params: { ticketNumber: ticketNum },
        });
        setHistory(histRes.data);
      } catch (err) {
        console.error("Error loading ticket or history:", err);
      }
    };
    loadTicketAndHistory();
  }, [ticketNum]);

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/departments`);
        setAssigneeDepts(data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  // Load sub-departments whenever department changes
  useEffect(() => {
    if (!updatedAssigneeDept) {
      setAssigneeSubDepts([]);
      setUpdatedAssigneeSubDept("");
      setUpdatedAssigneeEmpID("");
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/subdepartments`, {
        params: { department: updatedAssigneeDept },
      })
      .then((res) => {
        setAssigneeSubDepts(res.data);
        if (!res.data.includes(updatedAssigneeSubDept)) {
          setUpdatedAssigneeSubDept("");
          setUpdatedAssigneeEmpID("");
        }
      })
      .catch((err) => console.error("Error fetching subdepartments:", err));
  }, [updatedAssigneeDept, updatedAssigneeSubDept]);

  // Load employees whenever sub-department changes
  useEffect(() => {
    if (!updatedAssigneeDept || !updatedAssigneeSubDept) {
      setAssigneeEmpIDs([]);
      setUpdatedAssigneeEmpID("");
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/employees`, {
        params: {
          department: updatedAssigneeDept,
          subdepartment: updatedAssigneeSubDept,
        },
      })
      .then((res) => {
        setAssigneeEmpIDs(res.data);
        if (!res.data.some((emp) => emp.EmpID === updatedAssigneeEmpID)) {
          setUpdatedAssigneeEmpID("");
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, [updatedAssigneeDept, updatedAssigneeSubDept, updatedAssigneeEmpID]);

  // ── EARLY RETURN WHILE LOADING ───────────────────────────────────────────────
  if (!ticket || ticket.Ticket_Number !== ticketNum) {
    return (
      <Container>
        <Sidebar activeTab="Ticket Details" />
        <Content>
          <p>Loading ticket…</p>
        </Content>
      </Container>
    );
  }

  // ── DERIVED VALUES (now that ticket is loaded) ──────────────────────────────
  const isReporter = emailUser === ticket.Reporter_Email;
  const isAssignee = !isReporter;

  // ── HANDLER ────────────────────────────────────────────────────────────────
  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      const updatedTicketData = {
        Ticket_Number: ticket.Ticket_Number,
        Expected_Completion_Date: updatedExpectedDate,
        Ticket_Priority: updatedPriority,
        TStatus: updatedStatus,
        Assignee_Dept: updatedAssigneeDept,
        Assignee_SubDept: updatedAssigneeSubDept,
        Assignee_EmpID: updatedAssigneeEmpID,
        IT_Incident_Date: itIncidentDate,
        IT_Incident_Time: itIncidentTime,
        IT_Ack_Flag: itAckFlag,
        IT_Ack_Timestamp: itAckTimestamp,
        UserID: emailUser,
        Comment: remarks,
      };
      await axios.post(`${API_BASE_URL}/api/update-ticket`, updatedTicketData);
      navigate(-1);
    } catch (err) {
      console.error("Error updating ticket:", err.response || err);
    }
  };

  return (
    <div>
      <Container>
        <Sidebar activeTab="Ticket Details" />
        <Content>
          <TicketDetails isHistoryVisible={isHistoryVisible}>
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
            <Title>Ticket Details - {ticket.Ticket_Number}</Title>

            <DetailRow>
              <strong>Creation Date:</strong>{" "}
              {new Date(ticket.Creation_Date).toISOString().split("T")[0]}
            
              <strong>Ticket Title:</strong> {ticket.Ticket_Title}
            
              <strong>Description:</strong> {ticket.Ticket_Description}
            </DetailRow>
            {/* grouped static fields */}
            <DetailRow>
              <strong>Reporter Name:</strong>
              <span>{stripDup(ticket.Reporter_Name)}</span>
              <strong>Reporter Email:</strong>
              <span>{stripDup(ticket.Reporter_Email)}</span>
            </DetailRow>
            <DetailRow>
              <strong>Department:</strong>
              <span>{ticket.Assignee_Dept}</span>
              <strong>Sub‑Dept:</strong>
              <span>{ticket.Assignee_SubDept}</span>
            </DetailRow>
            <DetailRow>
              <strong>Incident Date:</strong>
              <span>{formatISODate(ticket.Incident_Reported_Date)}</span>
              <strong>Incident Time:</strong>
              <span>{formatTimeIST(ticket.Incident_Reported_Time)}</span>
              <button onClick={() => setShowDisputeModal(true)}>
                Dispute?
              </button>
            </DetailRow>
            {/* once they’ve saved a dispute, show it here */}
            {itIncidentDate && itIncidentTime && !showDisputeModal && (
              <DetailRow>
                <strong>IT Incident Date:</strong>
                <span>{itIncidentDate}</span>
                <strong>IT Incident Time:</strong>
                <span>{itIncidentTime}</span>
              </DetailRow>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
              <ModalOverlay>
                <ModalContent>
                  <ModalLabel>IT Incident Date</ModalLabel>
                  <Input
                    type="date"
                    value={itIncidentDate}
                    onChange={(e) => setItIncidentDate(e.target.value)}
                  />
                  <ModalLabel>IT Incident Time</ModalLabel>
                  <Input
                    type="time"
                    value={itIncidentTime}
                    onChange={(e) => setItIncidentTime(e.target.value)}
                  />
                  <ModalActions>
                    <button onClick={handleCancelDispute}>Cancel</button>
                    <SubmitButton onClick={handleSaveDispute}>
                      Save
                    </SubmitButton>
                  </ModalActions>
                </ModalContent>
              </ModalOverlay>
            )}

            {ticket.Attachment && (
              <DetailRow>
                <strong>Attachment:</strong>
                <span>
                  <img
                    src={`${API_BASE_URL}/uploads/${ticket.Attachment}`}
                    alt="Ticket Attachment"
                    style={{ maxWidth: "300px", borderRadius: "8px" }}
                  />
                </span>
              </DetailRow>
            )}

            {/* Editable fields: Only assignee can change most fields */}
            <FormRow>
              <Label>Status:</Label>
              <div>
                {["In-Progress", "Overdue", "Resolved"].map((opt) => (
                  <label key={opt} style={{ marginRight: 16 }}>
                    <input
                      type="radio"
                      name="status"
                      value={opt}
                      checked={updatedStatus === opt}
                      disabled={!isAssignee}
                      onChange={() => setUpdatedStatus(opt)}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>
            </FormRow>

            {isReporter && updatedStatus === "Resolved" && (
              <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                <h3>
                  This ticket has been resolved. Please accept or reject the
                  resolution:
                </h3>
                <button
                  style={{
                    marginRight: "10px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 15px",
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    try {
                      await axios.post(
                        `${API_BASE_URL}/api/tickets/respond-resolution`,
                        {
                          ticketNumber: ticket.Ticket_Number,
                          action: "accept",
                          userID: emailUser,
                        }
                      );
                      alert("Resolution accepted. Ticket will be closed.");
                      navigate(-1);
                    } catch (error) {
                      console.error("Error accepting resolution:", error);
                    }
                  }}
                >
                  Accept Resolution
                </button>
                <button
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 15px",
                    cursor: "pointer",
                  }}
                  onClick={async () => {
                    try {
                      await axios.post(
                        `${API_BASE_URL}/api/tickets/respond-resolution`,
                        {
                          ticketNumber: ticket.Ticket_Number,
                          action: "reject",
                          userID: emailUser,
                        }
                      );
                      alert(
                        "Ticket re-opened. Ticket will be marked as In-Progress."
                      );
                      navigate(-1);
                    } catch (error) {
                      console.error("Error re-opening ticket:", error);
                    }
                  }}
                >
                  Reopen Ticket
                </button>

                <p
                  style={{
                    color: "#a00",
                    fontStyle: "italic",
                    marginTop: "10px",
                  }}
                >
                  Note: Tickets are automatically closed 5 days after
                  resolution, and cannot be reopened or manually closed
                  thereafter.
                </p>
              </div>
            )}

            <FormRow>
              <Label>Assignee Department:</Label>
              <Select
                value={updatedAssigneeDept}
                onChange={(e) => setUpdatedAssigneeDept(e.target.value)}
                disabled={!isAssignee}
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
                onChange={(e) => setUpdatedAssigneeSubDept(e.target.value)}
                disabled={!isAssignee || !updatedAssigneeDept}
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
                disabled={!isAssignee || !updatedAssigneeSubDept}
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
                disabled={!isAssignee}
              />
            </FormRow>

            <FormRow>
              <Label>Priority:</Label>
              <Select
                value={updatedPriority}
                onChange={(e) => setUpdatedPriority(e.target.value)}
                disabled={!isAssignee}
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </FormRow>

            {/* Remarks field now always enabled for both reporter and assignee */}
            <FormRow>
              <Label>Remarks:</Label>
              <TextArea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks (optional)"
              />
            </FormRow>

            {(isAssignee || isHod) && (
              <>
                <FormRow>
                  <Label>IT Acknowledged:</Label>
                  <button
                    type="button"
                    disabled={itAckFlag}
                    onClick={async () => {
                      try {
                        const { data } = await axios.post(
                          `${API_BASE_URL}/api/acknowledge-ticket`,
                          {
                            ticketNumber: ticket.Ticket_Number,
                            userID: emailUser,
                            comment: "IT Acknowledged",
                          }
                        );
                        setItAckFlag(true);
                        setItAckTimestamp(data.itAckTimestamp);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to acknowledge. Please try again.");
                      }
                    }}
                  >
                    {itAckFlag ? "Acknowledged" : "Acknowledge"}
                  </button>
                </FormRow>
                {/* show timestamp if present */}
                {itAckTimestamp && (
                  <DetailRow>
                    <strong>IT Ack Time:</strong>
                    <span>
                      {itAckTimestamp.slice(0, 10)}{" "}
                      {itAckTimestamp.slice(11, 16)}
                    </span>
                  </DetailRow>
                )}
              </>
            )}

            {/* Show submit button for both assignee and reporter */}
            {(isAssignee || isReporter) && (
              <SubmitButton
                type="button"
                onClick={(e) => handleUpdateTicket(e)}
              >
                Submit
              </SubmitButton>
            )}
          </TicketDetails>

          <HistoryToggleButton
            visible={isHistoryVisible}
            onClick={() => setIsHistoryVisible(!isHistoryVisible)}
          >
            {isHistoryVisible ? "Hide History" : "Show History"}
          </HistoryToggleButton>

          <HistoryPanel visible={isHistoryVisible}>
            <HistoryTitle>Ticket History</HistoryTitle>
            {history.map((item, index) => (
              <HistoryItem key={index}>
                <div>
                  <strong>Committed By:</strong> {item.CommittedBy}
                </div>
                <div>
                  <strong>Action:</strong> {item.Action_Type}
                </div>
                <div>
                  <strong>Before:</strong> {item.Before_State || "N/A"}
                </div>
                <div>
                  <strong>After:</strong> {item.After_State || "N/A"}
                </div>
                <div className="history-comment">
                  {item.Comment ? `Comment: ${item.Comment}` : ""}
                </div>
                <div>
                  <strong>Timestamp:</strong>
                  <div>
                    {item.Timestamp.slice(0, 10)} {item.Timestamp.slice(11, 16)}
                  </div>
                </div>
              </HistoryItem>
            ))}
          </HistoryPanel>
        </Content>
      </Container>
    </div>
  );
};

export default STicket;
