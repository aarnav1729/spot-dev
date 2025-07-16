import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = window.location.origin;

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #f5f6f8;
`;
const Content = styled.div`
  flex: 1;
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  @media (max-width: 768px) {
    margin-left: 60px;
    padding: 20px;
  }
`;
const TitleBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;
const Title = styled.h1`
  font-size: 24px;
`;
const Button = styled.button`
  background: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 16px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: #085a92;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;
const TH = styled.th`
  text-align: left;
  padding: 12px;
  background: #f9f9f9;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
  position: sticky;
  top: 0;
`;
const TD = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
`;
const ActionIcon = styled.span`
  cursor: pointer;
  margin-right: 8px;
  color: #0f6ab0;
  &:hover {
    color: #085a92;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;
const ModalContent = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;
const CloseButton = styled(FaTimes)`
  cursor: pointer;
  color: #999;
  &:hover {
    color: #666;
  }
`;
const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
`;
const Label = styled.label`
  font-weight: bold;
  margin-bottom: 5px;
`;
const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;
const Select = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;
const SubmitButton = styled.button`
  background: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 16px;
  cursor: pointer;
  &:hover {
    background: #085a92;
  }
`;
const CancelButton = styled.button`
  background: #ccc;
  color: #333;
  border: none;
  border-radius: 5px;
  padding: 10px 16px;
  cursor: pointer;
  &:hover {
    background: #aaa;
  }
`;

export default function AssigneeMappings() {
  const navigate = useNavigate();
  const [mappings, setMappings] = useState([]);

  // dropdown options
  const [locationsOpts, setLocationsOpts] = useState([]);
  const [departmentsOpts, setDepartmentsOpts] = useState([]);
  const [subDeptOpts, setSubDeptOpts] = useState([]);
  const [subTaskOpts, setSubTaskOpts] = useState([]);
  const [taskLabelOpts, setTaskLabelOpts] = useState([]);
  const [ticketTypeOpts, setTicketTypeOpts] = useState([]);
  const [assigneeEmpOpts, setAssigneeEmpOpts] = useState([]);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    EmpLocation: "",
    EmpLocationOther: "",
    Department: "",
    DepartmentOther: "",
    SubDept: "",
    SubDeptOther: "",
    SubTask: "",
    SubTaskOther: "",
    Task_Label: "",
    Task_LabelOther: "",
    Ticket_Type: "",
    Ticket_TypeOther: "",
    Assignee_EmpID: "",
    Assignee_EmpIDOther: "",
  });

  // fetch all mappings
  const fetchAll = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/assignee-mappings`);
      setMappings(data);

      // derive dropdown lists
      const uniq = (arr) => Array.from(new Set(arr)).sort();
      setLocationsOpts(uniq(data.map((m) => m.EmpLocation)));
      setDepartmentsOpts(uniq(data.map((m) => m.Department)));
      setSubDeptOpts(uniq(data.map((m) => m.SubDept)));
      setSubTaskOpts(uniq(data.map((m) => m.SubTask)));
      setTaskLabelOpts(uniq(data.map((m) => m.Task_Label)));
      setTicketTypeOpts(uniq(data.map((m) => m.Ticket_Type)));
      setAssigneeEmpOpts(uniq(data.map((m) => String(m.Assignee_EmpID))));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      EmpLocation: "",
      EmpLocationOther: "",
      Department: "",
      DepartmentOther: "",
      SubDept: "",
      SubDeptOther: "",
      SubTask: "",
      SubTaskOther: "",
      Task_Label: "",
      Task_LabelOther: "",
      Ticket_Type: "",
      Ticket_TypeOther: "",
      Assignee_EmpID: "",
      Assignee_EmpIDOther: "",
    });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditingId(row.MappingID);
    setForm({
      EmpLocation: row.EmpLocation,
      EmpLocationOther: "",
      Department: row.Department,
      DepartmentOther: "",
      SubDept: row.SubDept,
      SubDeptOther: "",
      SubTask: row.SubTask,
      SubTaskOther: "",
      Task_Label: row.Task_Label,
      Task_LabelOther: "",
      Ticket_Type: row.Ticket_Type,
      Ticket_TypeOther: "",
      Assignee_EmpID: String(row.Assignee_EmpID),
      Assignee_EmpIDOther: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mapping?")) return;
    await axios.delete(`${API_BASE_URL}/api/assignee-mappings/${id}`);
    fetchAll();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // generic select handler to clear Other‑field when picking a real option
  const handleSelect = (field) => (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      [field]: val,
      [`${field}Other`]: val === "__other" ? "" : "",
    }));
  };

  const handleSubmit = async () => {
    // build payload picking "Other" if needed
    const pick = (f) =>
      form[f] === "__other" ? form[`${f}Other`].trim() : form[f].trim();

    const payload = {
      EmpLocation: pick("EmpLocation"),
      Department: pick("Department"),
      SubDept: pick("SubDept"),
      SubTask: pick("SubTask"),
      Task_Label: pick("Task_Label"),
      Ticket_Type: pick("Ticket_Type"),
      Assignee_EmpID: pick("Assignee_EmpID"),
    };

    // append newly created "Other" into our local options so next time it appears
    const appendIfOther = (opts, f) => {
      if (form[f] === "__other" && payload[f] && !opts.includes(payload[f])) {
        opts.push(payload[f]);
      }
    };
    appendIfOther(locationsOpts, "EmpLocation");
    appendIfOther(departmentsOpts, "Department");
    appendIfOther(subDeptOpts, "SubDept");
    appendIfOther(subTaskOpts, "SubTask");
    appendIfOther(taskLabelOpts, "Task_Label");
    appendIfOther(ticketTypeOpts, "Ticket_Type");
    appendIfOther(assigneeEmpOpts, "Assignee_EmpID");

    // send
    if (editingId) {
      await axios.put(
        `${API_BASE_URL}/api/assignee-mappings/${editingId}`,
        payload
      );
    } else {
      await axios.post(`${API_BASE_URL}/api/assignee-mappings`, payload);
    }

    setShowModal(false);
    fetchAll();
  };

  // helper to render a dropdown + optional Other textbox
  const renderField = (label, field, opts) => (
    <FormRow key={field}>
      <Label>{label}</Label>
      <Select name={field} value={form[field]} onChange={handleSelect(field)}>
        <option value="">— select —</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__other">Other…</option>
      </Select>
      {form[field] === "__other" && (
        <Input
          name={`${field}Other`}
          placeholder={`Enter new ${label.toLowerCase()}`}
          value={form[`${field}Other`]}
          onChange={handleChange}
        />
      )}
    </FormRow>
  );

  return (
    <Container>
      <Sidebar activeTab="Assignee Mappings" />
      <Content>
        <TitleBar>
          <Title>Assignee Mappings</Title>
          <Button onClick={openNew}>
            <FaPlus /> Add Mapping
          </Button>
        </TitleBar>

        <Table>
          <thead>
            <tr>
              <TH>Location</TH>
              <TH>Department</TH>
              <TH>SubDept</TH>
              <TH>SubTask</TH>
              <TH>Task Label</TH>
              <TH>Ticket Type</TH>
              <TH>Assignee EmpID</TH>
              <TH style={{ width: 120 }}>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.MappingID}>
                <TD>{m.EmpLocation}</TD>
                <TD>{m.Department}</TD>
                <TD>{m.SubDept}</TD>
                <TD>{m.SubTask}</TD>
                <TD>{m.Task_Label}</TD>
                <TD>{m.Ticket_Type}</TD>
                <TD>{m.Assignee_EmpID}</TD>
                <TD>
                  <ActionIcon onClick={() => openEdit(m)}>
                    <FaEdit />
                  </ActionIcon>
                  <ActionIcon onClick={() => handleDelete(m.MappingID)}>
                    <FaTrash />
                  </ActionIcon>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>

        {showModal && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>
                <h2>{editingId ? "Edit" : "New"} Mapping</h2>
                <CloseButton onClick={() => setShowModal(false)} />
              </ModalHeader>

              {renderField("EmpLocation", "EmpLocation", locationsOpts)}
              {renderField("Department", "Department", departmentsOpts)}
              {renderField("SubDept", "SubDept", subDeptOpts)}
              {renderField("SubTask", "SubTask", subTaskOpts)}
              {renderField("Task Label", "Task_Label", taskLabelOpts)}
              {renderField("Ticket Type", "Ticket_Type", ticketTypeOpts)}
              {renderField("Assignee EmpID", "Assignee_EmpID", assigneeEmpOpts)}

              <ModalFooter>
                <SubmitButton onClick={handleSubmit}>
                  {editingId ? "Update" : "Create"}
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
  );
}
