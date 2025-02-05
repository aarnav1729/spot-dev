import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaBuilding,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTasks,
  FaUsers,
  FaQuestionCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL = window.location.origin;
const SidebarContainer = styled.div`
  width: ${(props) => (props.collapsed ? "60px" : "250px")};

  background-color: #bebebe;
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
`;

const SidebarItem = styled.div`
  margin-bottom: 15px;
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

const NotificationBadge = styled.span`
  background-color: red;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  position: absolute;
  top: 5px;
  right: ${(props) => (props.collapsed ? "5px" : "10px")};
`;

const Sidebar = ({ activeTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  const storedUsername = localStorage.getItem("username");
  const fullEmailUser = `${storedUsername}@premierenergies.com`;

  const empID = localStorage.getItem("empID");
  const [isHOD, setIsHOD] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/notifications`,
          {
            params: { userID: fullEmailUser },
          }
        );
        console.log("Unread notifications count:", response.data.unreadCount);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
  }, []);

  // NEW: Check if the user is an HOD
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

  // Fetch the user's department from the EMP table and then the HODID from the HOD table
  useEffect(() => {
    const fetchDeptAndHODID = async () => {
      if (storedUsername && empID) {
        try {
          // Fetch user details to get department
          const userResponse = await axios.get(`${API_BASE_URL}/api/user`, {
            params: { email: storedUsername },
          });
          
          const userDept = userResponse.data.Dept;

          // Now fetch HODID for this department from HOD table
          const hodResponse = await axios.get(`${API_BASE_URL}/api/getHODForDept`, {
            params: { dept: userDept },
          });
          
          const hodID = hodResponse.data.HODID;

          // Log EmpID and HODID for verification
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

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <SidebarContainer collapsed={collapsed}>
      <div>
        <SidebarToggle collapsed={collapsed} onClick={toggleSidebar}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </SidebarToggle>

        <SidebarItem
          active={activeTab === "User Profile"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/profile")}
        >
          <FaUser />
          <SidebarItemText collapsed={collapsed}>User Profile</SidebarItemText>
        </SidebarItem>

        {isHOD && (
          <SidebarItem
            active={activeTab === "Department"}
            collapsed={collapsed}
            onClick={() => handleNavigation("/department")}
          >
            <FaBuilding />
            <SidebarItemText collapsed={collapsed}>Department</SidebarItemText>
          </SidebarItem>
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
          active={activeTab === "Priority Tasks"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/priority")}
        >
          <FaTasks />
          <SidebarItemText collapsed={collapsed}>
            Priority Tasks
          </SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={activeTab === "Team Structure"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/team")}
        >
          <FaUsers />
          <SidebarItemText collapsed={collapsed}>
            Team Structure
          </SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={activeTab === "FAQ's"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/faqs")}
        >
          <FaQuestionCircle />
          <SidebarItemText collapsed={collapsed}>FAQ's</SidebarItemText>
        </SidebarItem>

        <SidebarItem
          active={activeTab === "Notifications"}
          collapsed={collapsed}
          onClick={() => handleNavigation("/notifs")}
        >
          <FaBell />
          {unreadCount > 0 && (
            <NotificationBadge collapsed={collapsed}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </NotificationBadge>
          )}
          <SidebarItemText collapsed={collapsed}>Notifications</SidebarItemText>
        </SidebarItem>

        <LogoutButton
          collapsed={collapsed}
          onClick={() => handleNavigation("/login")}
        >
          <FaSignOutAlt />
          <SidebarItemText collapsed={collapsed}>Logout</SidebarItemText>
        </LogoutButton>
      </div>
    </SidebarContainer>
  );
};

export default Sidebar;