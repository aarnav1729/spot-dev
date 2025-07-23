// src/pages/Companies.js
import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";

const API = window.location.origin;

// ─── layout ───────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  background: #f0f4f8;
  min-height: calc(100vh - 70px);
`;

const Content = styled.main`
  flex: 1;
  padding: 24px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  color: #0f6ab0;
  margin: 0;
  font-size: 28px;
`;

const PageSubtitle = styled.p`
  color: #666;
  margin: 4px 0 0;
  font-size: 14px;
`;

// ─── card ─────────────────────────────────────────────────────────────

const Card = styled.section`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: #333;
`;

const CardSubtitle = styled.p`
  margin: 4px 0 0;
  color: #666;
  font-size: 13px;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 240px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  &:focus {
    outline: none;
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15,106,176,0.2);
  }
`;

const PrimaryButton = styled.button`
  background-color: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  &:hover { background-color: #0d5a99; }
  &:disabled { background: #999; cursor: default; }
`;

// ─── inline form ───────────────────────────────────────────────────────

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-end;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 13px;
  margin-bottom: 4px;
  color: #0f6ab0;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  &:focus {
    outline: none;
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15,106,176,0.2);
  }
`;

const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const SecondaryButton = styled.button`
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
`;

// ─── table ─────────────────────────────────────────────────────────────

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    color: #333;
  }
  th {
    color: #0f6ab0;
    font-weight: 600;
    text-align: left;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #0f6ab0;
  cursor: pointer;
  margin-right: 8px;
  &:hover { color: #0d5a99; }
`;

const ErrorMsg = styled.p`
  color: #a00;
  margin-top: 12px;
  text-align: center;
`;

// ─── component ─────────────────────────────────────────────────────────

export default function Companies() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    CompanyCode: "",
    CompanyShortName: "",
    CompanyName: "",
  });
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    try {
      const { data } = await axios.get(`${API}/api/companies`);
      setList(data);
    } catch {
      setError("Failed to load companies");
    }
  }

  function resetForm() {
    setForm({ CompanyCode: "", CompanyShortName: "", CompanyName: "" });
    setEditing(false);
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/api/companies/${form.CompanyCode}`, form);
      } else {
        await axios.post(`${API}/api/companies`, {
          ...form,
          CompanyCode: Number(form.CompanyCode),
        });
      }
      resetForm();
      fetchList();
    } catch {
      setError("Save failed – please try again");
    }
  }

  function handleEdit(c) {
    setForm({
      CompanyCode: c.CompanyCode.toString(),
      CompanyShortName: c.CompanyShortName,
      CompanyName: c.CompanyName,
    });
    setEditing(true);
    setShowForm(true);
    setError("");
  }

  async function handleDelete(code) {
    if (!window.confirm("Delete this company?")) return;
    try {
      await axios.delete(`${API}/api/companies/${code}`);
      if (`${form.CompanyCode}` === `${code}`) resetForm();
      fetchList();
    } catch {
      setError("Delete failed – please try again");
    }
  }

  const visible = list.filter(c =>
    c.CompanyShortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.CompanyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.CompanyCode.toString().includes(searchTerm)
  );

  return (
    <Container>
      <Sidebar activeTab="Companies" />
      <Content>
        <PageHeader>
          <PageTitle>Company Master</PageTitle>
          <PageSubtitle>Manage company information</PageSubtitle>
        </PageHeader>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Companies</CardTitle>
              <CardSubtitle>List of all registered companies</CardSubtitle>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SearchInput
                placeholder="Search companies…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <PrimaryButton onClick={() => { resetForm(); setShowForm(true); }}>
                + Add Company
              </PrimaryButton>
            </div>
          </CardHeader>

          {showForm && (
            <FormGrid onSubmit={handleSubmit}>
              <Field>
                <Label>Code</Label>
                <Input
                  type="number"
                  value={form.CompanyCode}
                  onChange={e => setForm({ ...form, CompanyCode: e.target.value })}
                  required
                  disabled={editing}
                  placeholder="e.g. 1001"
                />
              </Field>
              <Field>
                <Label>Short Name</Label>
                <Input
                  value={form.CompanyShortName}
                  onChange={e => setForm({ ...form, CompanyShortName: e.target.value })}
                  required
                  placeholder="e.g. TechCorp"
                />
              </Field>
              <Field>
                <Label>Full Name</Label>
                <Input
                  value={form.CompanyName}
                  onChange={e => setForm({ ...form, CompanyName: e.target.value })}
                  required
                  placeholder="e.g. Technology Corporation Ltd."
                />
              </Field>
              <FormActions>
                <SecondaryButton type="button" onClick={resetForm}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit">
                  {editing ? "Update Company" : "Create Company"}
                </PrimaryButton>
              </FormActions>
            </FormGrid>
          )}

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Table>
            <thead>
              <tr>
                <th>Company Code</th>
                <th>Short Name</th>
                <th>Company Name</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => (
                <tr key={c.CompanyCode}>
                  <td>{c.CompanyCode}</td>
                  <td>{c.CompanyShortName}</td>
                  <td>{c.CompanyName}</td>
                  <td>
                    <ActionButton onClick={() => handleEdit(c)}>✏️</ActionButton>
                    <ActionButton onClick={() => handleDelete(c.CompanyCode)}>
                      🗑️
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </Content>
    </Container>
  );
}