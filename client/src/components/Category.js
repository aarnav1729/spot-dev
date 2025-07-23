// src/pages/Category.js
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

// ─── two‑card grid ────────────────────────────────────────────────────

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
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
  max-width: 220px;
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
`;

// ─── inline form ───────────────────────────────────────────────────────

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
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

// ─── table & rows ─────────────────────────────────────────────────────

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

const TableRow = styled.tr`
  cursor: pointer;
  ${({ selected }) => selected && css`
    background: rgba(15, 106, 176, 0.1);
  `}
  &:hover {
    background: rgba(15, 106, 176, 0.05);
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

export default function Category() {
  // categories state
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ id: null, name: "" });
  const [catEditing, setCatEditing] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  // subcategories state
  const [selectedCat, setSelectedCat] = useState({ id: null, name: "" });
  const [subcats, setSubcats] = useState([]);
  const [subForm, setSubForm] = useState({ id: null, name: "" });
  const [subEditing, setSubEditing] = useState(false);
  const [subSearch, setSubSearch] = useState("");

  // load categories once
  useEffect(() => { fetchCategories() }, []);

  // when categories load, auto-select first
  useEffect(() => {
    if (!selectedCat.id && categories.length) {
      handleCatSelect(categories[0]);
    }
  }, [categories]);

  async function fetchCategories() {
    try {
      const { data } = await axios.get(`${API}/api/categories`);
      setCategories(data);
    } catch {
      alert("Failed to load categories");
    }
  }

  async function fetchSubcats(catId) {
    try {
      const { data } = await axios.get(`${API}/api/subcategories`, {
        params: { categoryId: catId }
      });
      setSubcats(data);
    } catch {
      alert("Failed to load subcategories");
    }
  }

  // ── CATEGORY CRUD ─────────────────────────────────────

  async function handleCatSubmit(e) {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    try {
      if (catEditing) {
        await axios.put(`${API}/api/categories/${catForm.id}`, { name: catForm.name });
      } else {
        await axios.post(`${API}/api/categories`, { name: catForm.name });
      }
      resetCatForm();
      fetchCategories();
    } catch {
      alert("Save failed");
    }
  }

  function handleCatEdit(c) {
    setCatEditing(true);
    setCatForm({ id: c.id, name: c.name });
    handleCatSelect(c);
  }

  async function handleCatDelete(id) {
    if (!window.confirm("Delete this category and all its subcategories?")) return;
    try {
      await axios.delete(`${API}/api/categories/${id}`);
      if (selectedCat.id === id) setSelectedCat({ id: null, name: "" });
      fetchCategories();
    } catch {
      alert("Delete failed");
    }
  }

  function resetCatForm() {
    setCatEditing(false);
    setCatForm({ id: null, name: "" });
  }

  function handleCatSelect(c) {
    setSelectedCat(c);
    resetCatForm();
    resetSubForm();
    fetchSubcats(c.id);
  }

  // ── SUBCATEGORY CRUD ──────────────────────────────────

  async function handleSubSubmit(e) {
    e.preventDefault();
    if (!subForm.name.trim() || !selectedCat.id) return;
    try {
      if (subEditing) {
        await axios.put(`${API}/api/subcategories/${subForm.id}`, { name: subForm.name });
      } else {
        await axios.post(`${API}/api/subcategories`, {
          categoryId: selectedCat.id,
          name: subForm.name,
        });
      }
      resetSubForm();
      fetchSubcats(selectedCat.id);
    } catch {
      alert("Save failed");
    }
  }

  function handleSubEdit(s) {
    setSubEditing(true);
    setSubForm({ id: s.id, name: s.name });
  }

  async function handleSubDelete(id) {
    if (!window.confirm("Delete this subcategory?")) return;
    try {
      await axios.delete(`${API}/api/subcategories/${id}`);
      fetchSubcats(selectedCat.id);
    } catch {
      alert("Delete failed");
    }
  }

  function resetSubForm() {
    setSubEditing(false);
    setSubForm({ id: null, name: "" });
  }

  // ── filtered lists ─────────────────────────────────────

  const visibleCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(catSearch.toLowerCase())
  );

  const visibleSubs = subcats.filter(s =>
    s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.id.toLowerCase().includes(subSearch.toLowerCase())
  );

  return (
    <Container>
      <Sidebar activeTab="Categories" />
      <Content>
        <PageHeader>
          <PageTitle>Category & Subcategory Master</PageTitle>
          <PageSubtitle>Manage ticket categories and subcategories</PageSubtitle>
        </PageHeader>

        <CardsGrid>

          {/* ── Categories Card ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Categories</CardTitle>
                <CardSubtitle>Manage main categories</CardSubtitle>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <SearchInput
                  placeholder="Search categories…"
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                />
                <PrimaryButton onClick={() => { resetCatForm(); setCatEditing(false); }}>
                  + Add Category
                </PrimaryButton>
              </div>
            </CardHeader>

            <FormGrid onSubmit={handleCatSubmit}>
              <Field>
                <Label>Category Name</Label>
                <Input
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Hardware Issues"
                  required
                />
              </Field>
              <FormActions>
                <SecondaryButton type="button" onClick={resetCatForm}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit">
                  {catEditing ? "Update Category" : "Save Category"}
                </PrimaryButton>
              </FormActions>
            </FormGrid>

            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCats.map(c => (
                  <TableRow
                    key={c.id}
                    selected={selectedCat.id === c.id}
                    onClick={e => {
                      // if click target is not an action button, select row
                      if (!e.target.closest("button")) handleCatSelect(c);
                    }}
                  >
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>
                      <ActionButton onClick={() => handleCatEdit(c)}>✏️</ActionButton>
                      <ActionButton onClick={() => handleCatDelete(c.id)}>🗑️</ActionButton>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* ── Subcategories Card ──────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Subcategories</CardTitle>
                <CardSubtitle>
                  {selectedCat.name
                    ? `Subcategories for ${selectedCat.name}`
                    : "Select a category on the left"}
                </CardSubtitle>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <SearchInput
                  placeholder="Search subcategories…"
                  disabled={!selectedCat.id}
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                />
                <PrimaryButton
                  disabled={!selectedCat.id}
                  onClick={() => resetSubForm()}
                >
                  + Add Subcategory
                </PrimaryButton>
              </div>
            </CardHeader>

            {selectedCat.id && (
              <>
                <FormGrid onSubmit={handleSubSubmit}>
                  <Field>
                    <Label>Subcategory Name</Label>
                    <Input
                      value={subForm.name}
                      onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                      placeholder="e.g. Printer Issues"
                      required
                    />
                  </Field>
                  <FormActions>
                    <SecondaryButton type="button" onClick={resetSubForm}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit">
                      {subEditing ? "Update Subcategory" : "Save Subcategory"}
                    </PrimaryButton>
                  </FormActions>
                </FormGrid>

                <Table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subcategory Name</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSubs.map(s => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td>
                          <ActionButton onClick={() => handleSubEdit(s)}>✏️</ActionButton>
                          <ActionButton onClick={() => handleSubDelete(s.id)}>🗑️</ActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </Card>

        </CardsGrid>
      </Content>
    </Container>
  );
}
