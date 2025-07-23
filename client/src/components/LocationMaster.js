import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API_BASE_URL = window.location.origin;

// ─── layout ───────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
`;

const Content = styled.main`
  flex: 1;
  padding: 24px;
  background: #f0f4f8;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  color: #0f6ab0;
`;

const PrimaryButton = styled.button`
  background-color: #0f6ab0;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  &:hover { background-color: #0d5a99; }
`;

// ─── card ─────────────────────────────────────────────────────────────

const Card = styled.section`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px;
`;

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
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
  font-size: 14px;
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

// ─── inline form ───────────────────────────────────────────────────────

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 6px;
  color: #0f6ab0;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  &:focus {
    outline: none;
    border-color: #0f6ab0;
    box-shadow: 0 0 6px rgba(15,106,176,0.2);
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  grid-column: 1 / -1;
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
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    color: #333;
  }
  th {
    color: #0f6ab0;
    font-weight: 600;
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

export default function LocationMasterPage() {
  const [locations, setLocations] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [companyCode, setCompanyCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchLocations = () =>
    axios
      .get(`${API_BASE_URL}/api/spotLocations`)
      .then(r => setLocations(r.data))
      .catch(() => setError("Failed to load locations"));

  useEffect(fetchLocations, []);

  const resetForm = () => {
    setCompanyCode("");
    setLocationName("");
    setEditingId(null);
    setError("");
    setShowForm(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!companyCode || !locationName.trim()) {
      setError("Both fields are required");
      return;
    }
    const payload = {
      CompanyCode: parseInt(companyCode, 10),
      LocationName: locationName.trim(),
    };
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/spotLocations/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/api/spotLocations`, payload);
      }
      fetchLocations();
      resetForm();
    } catch {
      setError("Save failed—try again");
    }
  };

  const startEdit = loc => {
    setEditingId(loc.LocationID);
    setCompanyCode(loc.CompanyCode.toString());
    setLocationName(loc.LocationName);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/spotLocations/${id}`);
      fetchLocations();
    } catch {
      setError("Delete failed—try again");
    }
  };

  // filter list
  const visible = locations.filter(
    l =>
      l.LocationName.toLowerCase().includes(filter.toLowerCase()) ||
      l.CompanyCode.toString().includes(filter)
  );

  return (
    <Container>
      <Sidebar activeTab="Location Master" />
      <Content>
        <PageHeader>
          <PageTitle>Location Master</PageTitle>
          <PrimaryButton onClick={() => { resetForm(); setShowForm(true); }}>
            + Add Location
          </PrimaryButton>
        </PageHeader>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Locations</CardTitle>
              <CardSubtitle>List of all registered locations</CardSubtitle>
            </div>
            <SearchInput
              placeholder="Search..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </CardHeader>

          {showForm && (
            <FormGrid onSubmit={handleSubmit}>
              <Field>
                <Label>Company Code</Label>
                <Input
                  type="number"
                  value={companyCode}
                  onChange={e => setCompanyCode(e.target.value)}
                />
              </Field>
              <Field>
                <Label>Location Name</Label>
                <Input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                />
              </Field>
              <FormActions>
                <SecondaryButton type="button" onClick={resetForm}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit">
                  {editingId ? "Update" : "Create"}
                </PrimaryButton>
              </FormActions>
            </FormGrid>
          )}

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Table>
            <thead>
              <tr>
                <th>Company Code</th>
                <th>Location Name</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(loc => (
                <tr key={loc.LocationID}>
                  <td>{loc.CompanyCode}</td>
                  <td>{loc.LocationName}</td>
                  <td>
                    <ActionButton onClick={() => startEdit(loc)}>
                      ✏️
                    </ActionButton>
                    <ActionButton onClick={() => handleDelete(loc.LocationID)}>
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
