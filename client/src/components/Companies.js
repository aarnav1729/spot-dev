import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = window.location.origin;

// Styled components
const Container = styled.div`
  display: flex;
  background: #f0f4f8;
  min-height: calc(100vh - 70px);
`;
const Content = styled.div`
  flex: 1;
  padding: 40px;
`;
const Title = styled.h1`
  color: #0f6ab0;
  margin-bottom: 20px;
`;
const Form = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;
const Input = styled.input`
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const Button = styled.button`
  padding: 8px 12px;
  background: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled { background: #999; }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
    text-align: left;
  }
  th { background: #e1e7ee; }
  td button {
    margin-right: 8px;
  }
`;

export default function Companies() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    CompanyCode: "",
    CompanyShortName: "",
    CompanyName: "",
  });
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  // load on mount
  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      const { data } = await axios.get(`${API}/api/companies`);
      setList(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load companies");
    }
  };

  const resetForm = () => {
    setForm({ CompanyCode: "", CompanyShortName: "", CompanyName: "" });
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(
          `${API}/api/companies/${form.CompanyCode}`,
          form
        );
      } else {
        await axios.post(`${API}/api/companies`, {
          ...form,
          CompanyCode: Number(form.CompanyCode),
        });
      }
      resetForm();
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const handleEdit = (c) => {
    setForm({
      CompanyCode: c.CompanyCode.toString(),
      CompanyShortName: c.CompanyShortName,
      CompanyName: c.CompanyName,
    });
    setEditing(true);
  };

  const handleDelete = async (code) => {
    if (!window.confirm("Delete this company?")) return;
    try {
      await axios.delete(`${API}/api/companies/${code}`);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <Container>
      <Sidebar activeTab="Companies" />
      <Content>
        <Title>Companies</Title>

        <Form onSubmit={handleSubmit}>
          <Input
            type="number"
            placeholder="Code"
            required
            value={form.CompanyCode}
            onChange={(e) =>
              setForm({ ...form, CompanyCode: e.target.value })
            }
            disabled={editing}
          />
          <Input
            placeholder="Short Name"
            required
            value={form.CompanyShortName}
            onChange={(e) =>
              setForm({ ...form, CompanyShortName: e.target.value })
            }
          />
          <Input
            placeholder="Full Name"
            required
            value={form.CompanyName}
            onChange={(e) =>
              setForm({ ...form, CompanyName: e.target.value })
            }
          />
          <Button type="submit">
            {editing ? "Update" : "Add"}
          </Button>
          {editing && <Button onClick={resetForm}>Cancel</Button>}
        </Form>

        <Table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Short Name</th>
              <th>Full Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.CompanyCode}>
                <td>{c.CompanyCode}</td>
                <td>{c.CompanyShortName}</td>
                <td>{c.CompanyName}</td>
                <td>
                  <Button onClick={() => handleEdit(c)}>Edit</Button>
                  <Button onClick={() => handleDelete(c.CompanyCode)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Content>
    </Container>
  );
}