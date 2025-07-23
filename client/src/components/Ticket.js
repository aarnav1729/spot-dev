import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

const API_BASE_URL = window.location.origin;

// Updated Container: flex-direction is now always row.
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background: linear-gradient(to bottom right, #f0f4f8, #d9e2ec);
`;

const TitleInput = styled.input`
  margin: 10px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 400px;

  @media (max-width: 768px) {
    width: 80%;
  }
`;

const FieldHeader = styled.h3`
  width: 100%;
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 8px;
  color: #0f6ab0;
`;

const Content = styled.div`
  flex: 1;
  padding: 40px;
  box-sizing: border-box;
  width: 100%;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    width: auto;
    margin: 40px;
  }
`;

const Title = styled.h1`
  text-align: center;
  font-size: 36px;
  color: #0f6ab0;
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 16px;
  color: #555;
  margin-bottom: 30px;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const InputRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Input = styled.input`
  padding: 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 100%;
  max-width: 250px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15, 106, 176, 0.2);
    outline: none;
  }
`;

const Select = styled.select`
  padding: 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 100%;
  max-width: 260px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15, 106, 176, 0.2);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 90%;
  max-width: 800px;
  height: 150px;
  margin: 20px 0;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
`;

const SubmitButton = styled.button`
  background-color: #0f6ab0;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 20px;
`;

const Message = styled.p`
  color: red;
  text-align: center;
  font-size: 16px;
  margin-top: 20px;
`;

const ConfirmationOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ConfirmationModal = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  p {
    margin-bottom: 20px;
    font-size: 16px;
    color: #333;
  }

  button {
    margin-top: 0;
  }
`;

const CreateTicketPage = () => {
  // compute today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [subTasks, setSubTasks] = useState([]);
  const [taskLabels, setTaskLabels] = useState([]);

  // fixed IT department/sub-dept for IT Org
  const [selectedDepartment] = useState("IT");
  const [selectedSubDepartment] = useState("IT");
  const [selectedSubTask, setSelectedSubTask] = useState("");
  const [selectedTaskLabel, setSelectedTaskLabel] = useState("");

  const [ticketTitle, setTicketTitle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");

  const [ticketUrgency, setTicketUrgency] = useState("");
  const [urgencyDefs] = useState({
    High: "Affects core business operations, a critical service is completely down, or a large number of users are unable to perform their essential functions.",
    Medium:
      "A critical component or service is severely degraded, affecting a significant number of users or a key business function.",
    Low: "Affects an individual user or a smaller group of users, or a non-critical function of a system is impaired. Allows operations to continue, but with some inconvenience or reduced efficiency.",
  });

  // Companies & Locations
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [spotLocations, setSpotLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  const [ticketDescription, setTicketDescription] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [createdForEmail, setCreatedForEmail] = useState("");
  const [isAssigneeUser, setIsAssigneeUser] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");

  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [attachments, setAttachments] = useState(null);
  const navigate = useNavigate();

  // Auth check & "created for"
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (!stored) {
      navigate("/login");
      return;
    }
    setReporterEmail(stored);

    axios
      .get(`${API_BASE_URL}/api/user`, { params: { email: stored } })
      .then((r) =>
        axios.get(`${API_BASE_URL}/api/isAssignee`, {
          params: { empID: r.data.EmpID },
        })
      )
      .then((r) => {
        setIsAssigneeUser(r.data.isAssignee);
        if (r.data.isAssignee) {
          axios
            .get(`${API_BASE_URL}/api/assignees`)
            .then((x) => setAssignees(x.data))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [navigate]);

  // Debounced user search
  const fetchUserSuggestions = debounce((q) => {
    if (!q) {
      setUserSuggestions([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/search-employees`, { params: { q } })
      .then((r) => setUserSuggestions(r.data))
      .catch(() => setUserSuggestions([]));
  }, 300);

  // Load static dropdowns
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/departments`)
      .then((r) => setDepartments(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setSubDepartments([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/subdepartments`, {
        params: { department: selectedDepartment },
      })
      .then((r) => setSubDepartments(r.data))
      .catch(() => {});
    setSubTasks([]);
    setTaskLabels([]);
    setSelectedSubTask("");
    setSelectedTaskLabel("");
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedSubDepartment) {
      setSubTasks([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/subtasks`, {
        params: {
          department: selectedDepartment,
          subdepartment: selectedSubDepartment,
        },
      })
      .then((r) => setSubTasks(r.data))
      .catch(() => {});
    setTaskLabels([]);
    setSelectedSubTask("");
    setSelectedTaskLabel("");
  }, [selectedSubDepartment, selectedDepartment]);

  useEffect(() => {
    if (!selectedSubTask) {
      setTaskLabels([]);
      return;
    }
    axios
      .get(`${API_BASE_URL}/api/tasklabels`, {
        params: {
          department: selectedDepartment,
          subdepartment: selectedSubDepartment,
          subtask: selectedSubTask,
        },
      })
      .then((r) => setTaskLabels(r.data))
      .catch(() => {});
    setSelectedTaskLabel("");
  }, [selectedSubTask, selectedSubDepartment, selectedDepartment]);

  // Load companies
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/companies`)
      .then((r) => setCompanies(r.data))
      .catch(() => {});
  }, []);

  // Load locations for all companies
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/spotLocations`)
      .then((r) => setSpotLocations(r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // block future dates on submit
    if (incidentDate > today) {
      setErrorMessage("Incident date cannot be in the future.");
      return;
    }
    if (!reporterEmail) {
      setErrorMessage("User not logged in. Please log in again.");
      return;
    }

    const form = new FormData();
    form.append("title", ticketTitle);
    form.append("department", selectedDepartment);
    form.append("subDepartment", selectedSubDepartment);
    form.append("subTask", selectedSubTask);
    form.append("taskLabel", selectedTaskLabel);
    form.append("priority", ticketUrgency);
    form.append("description", ticketDescription);
    form.append("reporterEmail", reporterEmail);
    form.append("incidentReportedDate", incidentDate);
    form.append("incidentReportedTime", incidentTime);
    form.append("companyCode", selectedCompany);
    form.append("location", selectedLocation);

    if (isAssigneeUser && createdForEmail) {
      form.append("createdForEmail", createdForEmail);
    }
    if (attachments) {
      Array.from(attachments).forEach((file) =>
        form.append("attachments", file)
      );
    }

    axios
      .post(`${API_BASE_URL}/api/create-ticket`, form)
      .then(() => {
        setSuccessMessage(
          "Your incident was created successfully! Check your inbox."
        );
        setErrorMessage("");
        // reset form
        setTicketTitle("");
        setSelectedSubTask("");
        setSelectedTaskLabel("");
        setTicketUrgency("");
        setTicketDescription("");
        setAttachments(null);
        setSelectedCompany("");
        setSelectedLocation("");
        setSubDepartments([]);
        setSubTasks([]);
        setTaskLabels([]);
        setIncidentDate("");
        setIncidentTime("");
        setCreatedForEmail("");
      })
      .catch(() => {
        setErrorMessage("Failed to create ticket. Please try again.");
        setSuccessMessage("");
      });
  };

  return (
    <Container>
      <Sidebar activeTab="Create Ticket" />
      <Content>
        <Title>Create New Incident</Title>
        <Subtitle>
          All fields are mandatory and must be filled before incident submission
        </Subtitle>
        <p
          style={{
            textAlign: "center",
            fontStyle: "italic",
            color: "#a00",
            marginTop: "8px",
          }}
        >
          Note: Incidents auto‑close 5 days after resolution and cannot be
          reopened or manually closed thereafter.
        </p>
        <Form onSubmit={handleSubmit}>
          {isAssigneeUser && (
            <>
              <FieldHeader>Created For (username):</FieldHeader>
              <div style={{ position: "relative", width: "400px" }}>
                <TitleInput
                  type="text"
                  placeholder="Enter username (without @…) "
                  value={createdForEmail}
                  onChange={(e) => {
                    setCreatedForEmail(e.target.value);
                    fetchUserSuggestions(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                />
                {showSuggestions && userSuggestions.length > 0 && (
                  <ul
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      maxHeight: 200,
                      overflowY: "auto",
                      zIndex: 10,
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                    }}
                  >
                    {userSuggestions.map((u) => (
                      <li
                        key={u}
                        style={{ padding: "8px", cursor: "pointer" }}
                        onMouseDown={() => {
                          setCreatedForEmail(u);
                          setShowSuggestions(false);
                        }}
                      >
                        {u}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <FieldHeader>Title:</FieldHeader>
          <TitleInput
            type="text"
            placeholder="Enter incident title"
            required
            value={ticketTitle}
            onChange={(e) => setTicketTitle(e.target.value)}
          />

          <InputRow>
            <div style={{ flex: 1 }}>
              <FieldHeader>Location:</FieldHeader>
              <Select
                required
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {spotLocations.map((loc) => (
                  <option key={loc.LocationID} value={loc.LocationName}>
                    {loc.LocationName}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ flex: 1 }}>
              <FieldHeader>Category:</FieldHeader>
              <Select
                required
                value={selectedSubTask}
                onChange={(e) => setSelectedSubTask(e.target.value)}
              >
                <option value="">Select category</option>
                {subTasks.map((st, i) => (
                  <option key={i} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ flex: 1 }}>
              <FieldHeader>Sub-Category:</FieldHeader>
              <Select
                required
                value={selectedTaskLabel}
                onChange={(e) => setSelectedTaskLabel(e.target.value)}
              >
                <option value="">Select sub-category</option>
                {taskLabels.map((tl, i) => (
                  <option key={i} value={tl}>
                    {tl}
                  </option>
                ))}
              </Select>
            </div>
          </InputRow>

          <InputRow>
            <div style={{ flex: 1 }}>
              <FieldHeader>Priority:</FieldHeader>
              <Select
                required
                value={ticketUrgency}
                onChange={(e) => setTicketUrgency(e.target.value)}
              >
                <option value="">Select priority:</option>
                {["High", "Medium", "Low"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
              {ticketUrgency && (
                <small style={{ color: "#555" }}>
                  {urgencyDefs[ticketUrgency]}
                </small>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <FieldHeader>Incident Date:</FieldHeader>
              <Input
                type="date"
                value={incidentDate}
                max={today}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > today) {
                    setErrorMessage("Incident date cannot be in the future.");
                    setIncidentDate(today);
                  } else {
                    setErrorMessage("");
                    setIncidentDate(val);
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldHeader>Incident Time:</FieldHeader>
              <Input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
              />
            </div>
          </InputRow>

          <FieldHeader>Description:</FieldHeader>
          <TextArea
            placeholder="Enter incident description"
            required
            value={ticketDescription}
            onChange={(e) => setTicketDescription(e.target.value)}
          />

          <FieldHeader>Attachments:</FieldHeader>
          <div style={{ margin: "10px 0" }}>
            <input
              type="file"
              name="attachments"
              onChange={(e) => setAttachments(e.target.files)}
              multiple
            />
          </div>

          <SubmitButton type="submit">Create Incident</SubmitButton>
        </Form>

        {errorMessage && <Message>{errorMessage}</Message>}
        {successMessage && (
          <ConfirmationOverlay>
            <ConfirmationModal>
              <p>{successMessage}</p>
              <SubmitButton onClick={() => navigate(-1)}>Okay</SubmitButton>
            </ConfirmationModal>
          </ConfirmationOverlay>
        )}
      </Content>
    </Container>
  );
};

export default CreateTicketPage;
