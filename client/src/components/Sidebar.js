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
  FaIndustry,
  FaMapMarkerAlt,
  FaListAlt,
} from "react-icons/fa"; // Added new icons
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
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

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  const storedUsername = localStorage.getItem("username");
  const empID = localStorage.getItem("empID");
  const [isHOD, setIsHOD] = useState(false);
  const [isAssignee, setIsAssignee] = useState(false);

  useEffect(() => {
    if (empID) {
      axios
        .get(`${API_BASE_URL}/api/isAssignee`, { params: { empID } })
        .then((res) => setIsAssignee(res.data.isAssignee))
        .catch((err) => console.error("Error checking assignee:", err));
    }
  }, [empID]);

  useEffect(() => {
    if (empID) {
      axios
        .get(`${API_BASE_URL}/api/isHOD`, { params: { empID } })
        .then((res) => setIsHOD(res.data.isHOD))
        .catch((err) => console.error("Error checking HOD status:", err));
    }
  }, [empID]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("username");
    localStorage.removeItem("empID");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (path) => {
    if (location.pathname !== path) {
      navigate(path); // Ensure navigation only happens if the path is different
    }
  };

  return (
    <SidebarContainer collapsed={collapsed}>
      <div id="SidebarG">
        <SidebarToggle collapsed={collapsed} onClick={toggleSidebar}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </SidebarToggle>

        <SidebarItem
          active={location.pathname === "/profile"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/profile")}
        >
          <FaUser />
          <SidebarItemText collapsed={collapsed}>
            Incidents' Overview
          </SidebarItemText>
        </SidebarItem>

        {isHOD && (
          <>
            <SidebarItem
              active={location.pathname === "/department"}
              collapsed={collapsed}
              onClick={() => handleNavigation("/department")}
            >
              <FaTasks />
              <SidebarItemText collapsed={collapsed}>Department</SidebarItemText>
            </SidebarItem>

            <SidebarItem
              active={location.pathname === "/assignee-mappings"}
              collapsed={collapsed}
              onClick={() => handleNavigation("/assignee-mappings")}
            >
              <FaTasks />
              <SidebarItemText collapsed={collapsed}>
                Assignee Mappings
              </SidebarItemText>
            </SidebarItem>

            <SidebarItem
              active={location.pathname === "/companies"}
              collapsed={collapsed}
              onClick={() => handleNavigation("/companies")}
            >
              <FaIndustry />
              <SidebarItemText collapsed={collapsed}>Companies</SidebarItemText>
            </SidebarItem>

            <SidebarItem
              active={location.pathname === "/locations"}
              collapsed={collapsed}
              onClick={() => handleNavigation("/locations")}
            >
              <FaMapMarkerAlt />
              <SidebarItemText collapsed={collapsed}>Locations</SidebarItemText>
            </SidebarItem>

            <SidebarItem
              active={location.pathname === "/category"}
              collapsed={collapsed}
              onClick={() => handleNavigation("/category")}
            >
              <FaListAlt />
              <SidebarItemText collapsed={collapsed}>Category</SidebarItemText>
            </SidebarItem>
          </>
        )}

        <SidebarItem
          active={location.pathname === "/dashboard"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/dashboard")}
        >
          <FaTachometerAlt />
          <SidebarItemText collapsed={collapsed}>Dashboard</SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={location.pathname === "/ticket"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/ticket")}
        >
          <FaPenSquare />
          <SidebarItemText collapsed={collapsed}>
            Create IT Incident
          </SidebarItemText>
        </SidebarItem>

        {isAssignee && (
          <SidebarItem
            active={location.pathname === "/team"}
            collapsed={collapsed}
            onClick={() => handleNavigation("/team")}
          >
            <FaUsers />
            <SidebarItemText collapsed={collapsed}>IT Org Chart</SidebarItemText>
          </SidebarItem>
        )}

        <LogoutButton collapsed={collapsed} onClick={handleLogout}>
          <FaSignOutAlt />
          <SidebarItemText collapsed={collapsed}>Logout</SidebarItemText>
        </LogoutButton>
      </div>
    </SidebarContainer>
  );
};

export default Sidebar;
