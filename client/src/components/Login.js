import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import SVideo from "../assets/right.mp4";
import axios from "axios";

axios.defaults.withCredentials = true; // Ensure cookies are sent with requests

// point at DIGI’s API; override in .env as needed
const DIGI_API_URL = "https://digi.premierenergies.com:10443";

const API_BASE_URL = window.location.origin;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 70px); /* Adjusting for header height */
  overflow: hidden;
`; /* Prevents scrollbars */

const Content = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const LeftHalf = styled.div`
  flex: 1;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Ensures no scrollbars due to video */
  @media (max-width: 768px) {
    height: 300px; /* Set a fixed height on mobile */
  }
`;

const RightHalf = styled.div`
  flex: 1;
  background-color: #ffffff;
  padding: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Heading = styled.h1`
  color: #0f6ab0;
  font-size: 48px;
  margin-bottom: 30px;
  @media (max-width: 768px) {
    font-size: 36px;
    text-align: center;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 18px;
  color: #000000;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 15px;
  margin-bottom: 20px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const EmailInputContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const EmailInput = styled.input`
  padding: 15px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  box-sizing: border-box;
  padding-right: 120px; /* Space for the fixed text */
  @media (max-width: 768px) {
    padding-right: 140px; /* Adjusted for smaller screens */
  }
`;

const FixedText = styled.span`
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  font-size: 18px;
  font-family: "Montserrat";

  color: #0d1c08;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  @media (max-width: 768px) {
    right: 12px;
    font-size: 14px;
  }
`;

const SubmitButton = styled.button`
  background-color: #0f6ab0;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 15px;
  font-size: 18px;
  cursor: pointer;
  width: 200px;
  align-self: center;
  margin-bottom: 20px;
`;

const ForgotPassword = styled.p`
  color: #0d1c08;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
`;

export default function Login() {
  const navigate = useNavigate();
  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // if we already have an empID, skip straight in
  useEffect(() => {
    if (localStorage.getItem("empID")) {
      navigate("/profile");
    }
  }, [navigate]);

  // SSO ping to DIGI
  useEffect(() => {
    axios
      .get(`${DIGI_API_URL}/api/session`)
      .then(({ data }) => {
        if (data.loggedIn) {
          const userPart = data.email.split("@")[0];
          localStorage.setItem("username", userPart);
          localStorage.setItem("empID", data.empID.toString());
          navigate("/profile");
        }
      })
      .catch(() => {
        // swallow network errors
      });
  }, [navigate]);

  const handleForgotPassword = () => navigate("/forgot-password");

  const handleEmailChange = (e) => {
    setEmailUser(e.target.value.split("@")[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const resp = await axios.post(
        `${API_BASE_URL}/api/login`,
        { email: emailUser, password },
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("username", emailUser);
      localStorage.setItem("empID", resp.data.empID);
      navigate("/profile");
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage("Invalid username or password");
      } else {
        setErrorMessage("An error occurred. Please try again.");
        console.error(err);
      }
    }
  };

  return (
    <Container>
      <Content>
        <LeftHalf>
          <Video autoPlay loop muted playsInline>
            <source src={SVideo} type="video/mp4" />
          </Video>
        </LeftHalf>
        <RightHalf>
          <Heading>Welcome Back!</Heading>
          <Form onSubmit={handleSubmit}>
            <Label htmlFor="username">Username</Label>
            <EmailInputContainer>
              <EmailInput
                id="username"
                type="text"
                placeholder="Enter your username"
                value={emailUser}
                onChange={handleEmailChange}
                required
              />
              <FixedText>@premierenergies.com</FixedText>
            </EmailInputContainer>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            <SubmitButton type="submit">Submit</SubmitButton>
          </Form>
          <ForgotPassword onClick={handleForgotPassword}>
            Forgot Password?
          </ForgotPassword>
        </RightHalf>
      </Content>
    </Container>
  );
}
