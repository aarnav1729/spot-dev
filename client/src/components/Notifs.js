// Notifs.js
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = window.location.origin;

// Styled components
const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #eef2f7;
`;

const Content = styled.div`
  flex: 1;
  padding: 40px;
  background-color: #fff;
  box-sizing: border-box;
`;

const NotificationsTitle = styled.h1`
  color: #2c3e50;
  font-size: 32px;
  margin-bottom: 25px;
  font-weight: 700;
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const NotificationCard = styled.div`
  background-color: ${(props) => (props.isRead ? "#ecf0f1" : "#e8f6ff")};
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const NotificationHeader = styled.h3`
  font-size: 20px;
  color: #34495e;
  margin-bottom: 15px;
  font-weight: 600;
`;

const NotificationBody = styled.p`
  font-size: 16px;
  color: #7f8c8d;
  line-height: 1.5;
`;

const Notifs = () => {
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, read: 0, unread: 0 });
  const navigate = useNavigate();

  // Function to fetch notifications (always fetch all notifications)
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        params: { userID: `${localStorage.getItem("username")}@premierenergies.com`, filter: "all" },
      });
      setNotifications(response.data.notifications);
      setCounts(response.data.counts);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div>
      <Container>
        <Sidebar activeTab="Notifications" />
        <Content>
          <NotificationsTitle>Notifications</NotificationsTitle>
          <NotificationList>
            {notifications.length === 0 ? (
              <NotificationCard>
                <NotificationBody>No notifications available.</NotificationBody>
              </NotificationCard>
            ) : (
              notifications.map((notif) => (
                <NotificationCard key={notif.ID} isRead={notif.IsRead === 1}>
                  <NotificationHeader>
                    {notif.UserID} {notif.Comment}
                  </NotificationHeader>
                  <NotificationBody>
                    <strong>From:</strong> {notif.Before_State || "N/A"}
                    <br />
                    <strong>To:</strong> {notif.After_State || "N/A"}
                    <br />
                    <strong>Ticket Number:</strong> {notif.HTicket_Number}
                    <br />
                    <strong>Time:</strong>{" "}
                    {new Date(notif.Timestamp).toLocaleString()}
                  </NotificationBody>
                </NotificationCard>
              ))
            )}
          </NotificationList>
        </Content>
      </Container>
    </div>
  );
};

export default Notifs;
