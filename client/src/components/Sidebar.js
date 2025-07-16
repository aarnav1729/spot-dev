// Sidebar.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaBuilding,
  FaTasks,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUsers,
  FaQuestionCircle,
  FaPenSquare,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = window.location.origin;

const SidebarContainer = styled.div`
  width: ${(props) => (props.collapsed ? "60px" : "250px")};
  background: linear-gradient(
    357deg,
    rgba(15, 188, 83, 1) 25%,
    rgba(40, 102, 205, 1) 100%
  );
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: ${(props) => (props.collapsed ? "10px" : "30px")};
  box-sizing: border-box;
  justify-content: space-between;
  transition: width 0.3s ease;
`;

const SidebarToggle = styled.div`
  align-self: ${(props) => (props.collapsed ? "center" : "flex-end")};
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 24px;
  color: #ffffff;
  position: relative;
  z-index: 2000;
`;

const SidebarG = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  position: relative;
  z-index: 1000;
`;

const SidebarItem = styled.div`
  margin-bottom: 15px;
  position: relative;
  z-index: 2000;
  font-size: 18px;
  cursor: pointer;
  background-color: ${(props) => (props.active ? "#FFFFFF" : "transparent")};
  color: ${(props) => (props.active ? "black" : "black")};
  padding: 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  transition: padding 0.3s ease;
  justify-content: ${(props) => (props.collapsed ? "center" : "flex-start")};
`;

const SidebarItemText = styled.span`
  margin-left: 10px;
  display: ${(props) => (props.collapsed ? "none" : "inline")};
`;

const LogoutButton = styled(SidebarItem)`
  background-color: #ff0000;
  color: #ffffff;
  margin-top: auto;
`;

const Sidebar = ({ activeTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // We still fetch HOD status for conditional display of Department option.
  const storedUsername = localStorage.getItem("username");
  const empID = localStorage.getItem("empID");
  const [isHOD, setIsHOD] = useState(false);

  useEffect(() => {
    const checkHOD = async () => {
      if (empID) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/isHOD`, {
            params: { empID: empID },
          });
          setIsHOD(response.data.isHOD);
        } catch (error) {
          console.error("Error checking HOD status:", error);
        }
      }
    };
    checkHOD();
  }, [empID]);

  // Fetch the user's department and then HODID for verification (for logging purposes)
  useEffect(() => {
    const fetchDeptAndHODID = async () => {
      if (storedUsername && empID) {
        try {
          const userResponse = await axios.get(`${API_BASE_URL}/api/user`, {
            params: { email: storedUsername },
          });
          const userDept = userResponse.data.Dept;
          const hodResponse = await axios.get(
            `${API_BASE_URL}/api/getHODForDept`,
            {
              params: { dept: userDept },
            }
          );
          const hodID = hodResponse.data.HODID;
          console.log("Logged in EmpID:", empID);
          console.log("User's Department:", userDept);
          console.log("HODID for user's department:", hodID);
        } catch (error) {
          console.error("Error fetching department or HODID:", error);
        }
      }
    };
    fetchDeptAndHODID();
  }, [storedUsername, empID]);

  // Logout handler
  // Sidebar.js (logout handler portion)
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    }
    // Clear stored login data
    localStorage.removeItem("username");
    localStorage.removeItem("empID");
    // Redirect to landing page
    navigate("/login");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <SidebarContainer collapsed={collapsed}>
      <div id="SidebarG">
        <SidebarToggle collapsed={collapsed} onClick={toggleSidebar}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </SidebarToggle>

        <SidebarItem
          active={activeTab === "User Profile"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/profile")}
        >
          <FaUser />
          <SidebarItemText collapsed={collapsed}>
            Tickets' Overview
          </SidebarItemText>
        </SidebarItem>

        {isHOD && (
          <>
            <SidebarItem
              active={activeTab === "Department"}
              collapsed={collapsed}
              onClick={() => navigate("/department")}
            >
              <FaBuilding />
              <SidebarItemText collapsed={collapsed}>
                Department
              </SidebarItemText>
            </SidebarItem>

            <SidebarItem
              active={activeTab === "Assignee Mappings"}
              collapsed={collapsed}
              onClick={() => navigate("/assignee-mappings")}
            >
              <FaTasks />
              <SidebarItemText collapsed={collapsed}>
                Assignee Mappings
              </SidebarItemText>
            </SidebarItem>
          </>
        )}

        <SidebarItem
          active={activeTab === "Dashboard"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/dashboard")}
        >
          <FaTachometerAlt />
          <SidebarItemText collapsed={collapsed}>Dashboard</SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={activeTab === "Create Ticket"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/ticket")}
        >
          <FaPenSquare />
          <SidebarItemText collapsed={collapsed}>
            Create IT Ticket
          </SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={activeTab === "Team Structure"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/team")}
        >
          <FaUsers />
          <SidebarItemText collapsed={collapsed}>Team Structure</SidebarItemText>
        </SidebarItem>

        {/* Removed Priority Tasks SidebarItem 



        <SidebarItem
          active={activeTab === "FAQ's"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/faqs")}
        >
          <FaQuestionCircle />
          <SidebarItemText collapsed={collapsed}>FAQ's</SidebarItemText>
        </SidebarItem>

        {/* Removed Notifications SidebarItem */}

        <LogoutButton collapsed={collapsed} onClick={handleLogout}>
          <FaSignOutAlt />
          <SidebarItemText collapsed={collapsed}>Logout</SidebarItemText>
        </LogoutButton>
      </div>
    </SidebarContainer>
  );
};

export default Sidebar;
