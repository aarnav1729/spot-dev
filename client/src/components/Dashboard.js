// Dashboard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartJS_Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = window.location.origin;
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartJS_Title,
  Tooltip,
  Legend,
  ArcElement
);

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #ffffff;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
`;

const DashboardTitle = styled.h1`
  color: #0f6ab0;
  font-size: 36px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: bold;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  justify-content: center;
`;

const TabButton = styled.button`
  background-color: ${(props) => (props.active ? '#0f6ab0' : '#ffffff')};
  color: ${(props) => (props.active ? '#ffffff' : '#0f6ab0')};
  border: 2px solid #0f6ab0;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background-color: #0f6ab0;
    color: #ffffff;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  label {
    margin-bottom: 5px;
    font-weight: 500;
  }
  select,
  input {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;

const ChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 30px;
  margin-bottom: 40px;
`;

const ChartWrapper = styled.div`
  width: 45%;
  min-width: 300px;
  max-height: 450px;
  background-color: #f7f7f7;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ChartTitleStyled = styled.h3`
  font-size: 24px;
  color: #333;
  margin-bottom: 5px;
  text-align: center;
`;

const ChartDescription = styled.p`
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 15px;
`;

const ChartCanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [rawTickets, setRawTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [currentTab, setCurrentTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAssignee, setIsAssignee] = useState(false);
  const [isHOD, setIsHOD] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedResource, setSelectedResource] = useState('All'); // All / With Attachments / Without Attachments

  const storedUsername = localStorage.getItem('username');
  const empID = localStorage.getItem('empID');
  const emailUser = storedUsername ? `${storedUsername}@premierenergies.com` : '';

  // Fetch user details
  useEffect(() => {
    if (storedUsername) {
      axios
        .get(`${API_BASE_URL}/api/user`, { params: { email: storedUsername } })
        .then((res) => setUserData(res.data))
        .catch(console.error);
    }
  }, [storedUsername]);

  // Check roles
  useEffect(() => {
    if (empID) {
      axios
        .get(`${API_BASE_URL}/api/isAssignee`, { params: { empID } })
        .then((res) => setIsAssignee(res.data.isAssignee))
        .catch(console.error);

      axios
        .get(`${API_BASE_URL}/api/isHOD`, { params: { empID } })
        .then((res) => setIsHOD(res.data.isHOD))
        .catch(console.error);
    }
  }, [empID]);

  // Load employees list for HOD dropdown
  useEffect(() => {
    if (isHOD && userData.Dept) {
      axios
        .get(`${API_BASE_URL}/api/team-structure`, { params: { empID } })
        .then((res) => setEmployeesList(res.data.employees || []))
        .catch(console.error);
    }
  }, [isHOD, userData.Dept, empID]);

  // Build tabs with updated labels
  useEffect(() => {
    const createdByMe = { label: 'Created by Me', mode: 'assignedByMe' };
    const assignedToMe = { label: 'Assigned to Me', mode: 'assignedToMe' };
    const createdByDept = {
      label: 'Created by Department',
      mode: 'assignedByDept',
      department: userData.Dept,
    };
    const assignedToDept = {
      label: 'Assigned to Dept',
      mode: 'assignedToDept',
      department: userData.Dept,
    };

    if (isHOD) {
      setTabs([createdByMe, assignedToMe, assignedToDept, createdByDept]);
      setCurrentTab(createdByMe);
    } else if (isAssignee) {
      setTabs([createdByMe, assignedToMe]);
      setCurrentTab(createdByMe);
    } else {
      setTabs([{ label: 'My Tickets', mode: 'assignedByMe' }]);
      setCurrentTab({ label: 'My Tickets', mode: 'assignedByMe' });
    }
  }, [isHOD, isAssignee, userData.Dept]);

  // Fetch tickets whenever tab changes
  useEffect(() => {
    if (!currentTab) return;
    setLoading(true);
    const params = { mode: currentTab.mode, empID };
    if (currentTab.department) {
      params.department = currentTab.department;
    }
    axios
      .get(`${API_BASE_URL}/api/tickets`, { params })
      .then((res) => {
        const list = res.data.tickets || [];
        setRawTickets(list);
        // build location filter options
        setLocationsList(
          Array.from(new Set(list.map((t) => t.Reporter_Location))).filter(Boolean)
        );
      })
      .catch((err) => {
        console.error(err);
        setRawTickets([]);
        setLocationsList([]);
      })
      .finally(() => setLoading(false));
  }, [currentTab, empID, userData.Dept]);

  // Re-apply all filters whenever any filter or rawTickets change
  useEffect(() => {
    let ft = [...rawTickets];

    // Time filter
    const now = new Date();
    let start, end;
    if (filterType === 'Financial Year') {
      const month = now.getMonth();
      const year = now.getFullYear();
      if (month >= 3) {
        start = new Date(year, 3, 1);
        end = new Date(year + 1, 2, 31);
      } else {
        start = new Date(year - 1, 3, 1);
        end = new Date(year, 2, 31);
      }
    } else if (filterType === 'Quarter') {
      const m = now.getMonth();
      const y = now.getFullYear();
      if (m >= 3 && m <= 5)      { start = new Date(y, 3, 1);  end = new Date(y, 5, 30); }
      else if (m >= 6 && m <= 8) { start = new Date(y, 6, 1);  end = new Date(y, 8, 30); }
      else if (m >= 9 && m <=11) { start = new Date(y, 9, 1);  end = new Date(y,11,31); }
      else                       { start = new Date(y, 0, 1);  end = new Date(y,2,31);  }
    } else if (filterType === 'Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth()+1, 0);
    } else if (filterType === 'Date Range' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end   = new Date(customEndDate);
    }
    if (start && end) {
      ft = ft.filter((t) => {
        const d = new Date(t.Creation_Date);
        return d >= start && d <= end;
      });
    }

    // Employee filter (HOD)
    if (isHOD && selectedEmployee !== 'All') {
      ft = ft.filter((t) =>
        t.Reporter_EmpID === selectedEmployee ||
        t.Assignee_EmpID === selectedEmployee
      );
    }

    // Location filter
    if (selectedLocation !== 'All') {
      ft = ft.filter((t) => t.Reporter_Location === selectedLocation);
    }

    // Resource filter (attachments)
    if (selectedResource === 'With Attachments') {
      ft = ft.filter((t) => t.Attachment);
    } else if (selectedResource === 'Without Attachments') {
      ft = ft.filter((t) => !t.Attachment);
    }

    setFilteredTickets(ft);
  }, [
    rawTickets,
    filterType,
    customStartDate,
    customEndDate,
    selectedEmployee,
    selectedLocation,
    selectedResource,
    isHOD,
  ]);

  // Priority & status breakdowns based on filteredTickets
  const computePriorityCounts = () => {
    let high = 0, medium = 0, low = 0;
    filteredTickets.forEach((t) => {
      const p = (t.Ticket_Priority||'').toLowerCase();
      if (p==='high') high++;
      else if(p==='medium') medium++;
      else if(p==='low') low++;
    });
    return { high, medium, low };
  };

  const computeStatusCounts = () => {
    let inProgress = 0, resolved = 0, closed = 0, overdue = 0;
    filteredTickets.forEach((t) => {
      const s = (t.TStatus||'').toLowerCase();
      if (s==='in-progress') inProgress++;
      else if(s==='resolved') resolved++;
      else if(s==='closed') closed++;
      else if(s==='overdue') overdue++;
    });
    return {
      inProgress,
      resolved,
      closed,
      overdue,
      total: filteredTickets.length,
    };
  };

  const { high, medium, low } = computePriorityCounts();
  const { inProgress, resolved, closed, overdue, total } = computeStatusCounts();

  const priorityBarData = {
    labels: ['High','Medium','Low'],
    datasets: [{
      label: 'Tickets by Priority',
      data: [high, medium, low],
      backgroundColor: ['#FF6D6D','#FFDD00','#61B847'],
    }],
  };

  const priorityPieData = {
    labels: ['High','Medium','Low'],
    datasets: [{
      data: [high, medium, low],
      backgroundColor: ['#FF6D6D','#FFDD00','#61B847'],
    }],
  };

  const statusBarData = {
    labels: ['In-Progress','Resolved','Closed','Overdue','Total'],
    datasets: [{
      label: 'Tickets by Status',
      data: [inProgress, resolved, closed, overdue, total],
      backgroundColor: ['#0F6AB0','#61B847','#F57C00','#FF6D6D','#888888'],
    }],
  };

  const statusPieData = {
    labels: ['In-Progress','Resolved','Closed','Overdue','Total'],
    datasets: [{
      data: [inProgress, resolved, closed, overdue, total],
      backgroundColor: ['#0F6AB0','#61B847','#F57C00','#FF6D6D','#888888'],
    }],
  };

  return (
    <Container>
      <Sidebar activeTab="Dashboard" />
      <Content>
        <DashboardTitle>Dashboard</DashboardTitle>

        {tabs.length > 1 && (
          <TabsContainer>
            {tabs.map((tab) => (
              <TabButton
                key={tab.mode}
                active={currentTab?.mode === tab.mode}
                onClick={() => setCurrentTab(tab)}
              >
                {tab.label}
              </TabButton>
            ))}
          </TabsContainer>
        )}

        {!loading && (
          <FiltersContainer>
            <FilterGroup>
              <label>Time Period</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                <option>All Time</option>
                <option>Financial Year</option>
                <option>Quarter</option>
                <option>Month</option>
                <option>Date Range</option>
              </select>
            </FilterGroup>

            {filterType === 'Date Range' && (
              <>
                <FilterGroup>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </FilterGroup>
                <FilterGroup>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </FilterGroup>
              </>
            )}

            {isHOD && (
              <FilterGroup>
                <label>Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="All">All Employees</option>
                  {employeesList.map((emp) => (
                    <option key={emp.EmpID} value={emp.EmpID}>
                      {emp.EmpName}
                    </option>
                  ))}
                </select>
              </FilterGroup>
            )}

            <FilterGroup>
              <label>Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="All">All Locations</option>
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Resource</label>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
              >
                <option value="All">All</option>
                <option value="With Attachments">With Attachments</option>
                <option value="Without Attachments">Without Attachments</option>
              </select>
            </FilterGroup>
          </FiltersContainer>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <ChartContainer>
              <ChartWrapper>
                <ChartTitleStyled>
                  Priority Breakdown (Bar)
                </ChartTitleStyled>
                <ChartDescription>
                  Percentage of tickets that are High, Medium, and Low Priority.
                </ChartDescription>
                <ChartCanvasWrapper style={{ height: '300px' }}>
                  <Bar
                    data={priorityBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                    }}
                  />
                </ChartCanvasWrapper>
              </ChartWrapper>
              <ChartWrapper>
                <ChartTitleStyled>
                  Priority Breakdown (Pie)
                </ChartTitleStyled>
                <ChartDescription>
                  Distribution of tickets by priority level.
                </ChartDescription>
                <ChartCanvasWrapper style={{ height: '300px' }}>
                  <Pie
                    data={priorityPieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                    }}
                  />
                </ChartCanvasWrapper>
              </ChartWrapper>
            </ChartContainer>

            <ChartContainer>
              <ChartWrapper>
                <ChartTitleStyled>
                  Tickets Status Overview (Bar)
                </ChartTitleStyled>
                <ChartDescription>
                  Breakdown of ticket statuses.
                </ChartDescription>
                <ChartCanvasWrapper style={{ height: '300px' }}>
                  <Bar
                    data={statusBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                    }}
                  />
                </ChartCanvasWrapper>
              </ChartWrapper>
              <ChartWrapper>
                <ChartTitleStyled>
                  Tickets Status Overview (Pie)
                </ChartTitleStyled>
                <ChartDescription>
                  Distribution of tickets by status.
                </ChartDescription>
                <ChartCanvasWrapper style={{ height: '300px' }}>
                  <Pie
                    data={statusPieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                    }}
                  />
                </ChartCanvasWrapper>
              </ChartWrapper>
            </ChartContainer>
          </>
        )}
      </Content>
    </Container>
  );
}
