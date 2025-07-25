import React, { useState } from "react";
import styled from "styled-components";

import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = window.location.origin;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; /* For positioning the background */
  padding: 20px 20px 50px 20px;
  @media (max-width: 768px) {
    padding: 10px 20px 20px 20px;
  }
`;

const Content = styled.div`
  background-color: transparent;
  padding: 30px 30px 40px 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 100%;
  margin-top: 90px; /* Adjusted to prevent overlap with header */
  @media (max-width: 768px) {
    margin-top: 70px;
    padding: 20px 20px 30px 20px;
    max-width: 100%; /* Ensure content fits within the viewport */
  }
`;

const Heading = styled.h1`
  color: #0f6ab0;
  font-size: 36px;
  text-align: center;
  margin-bottom: 15px;
  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 10px;
  }
`;

const Paragraph = styled.p`
  color: #000000;
  font-size: 18px;
  text-align: center;
  margin-bottom: 25px;
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 15px;
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
  @media (max-width: 768px) {
    font-size: 16px;
  }
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
  padding-right: 180px; /* Space for the fixed text */
  @media (max-width: 768px) {
    padding-right: 140px; /* Adjusted for smaller screens */
  }
`;

const FixedText = styled.span`
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
  font-size: 16px;
  font-family: "Montserrat";
  color: black;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  @media (max-width: 768px) {
    right: 10px;
    font-size: 14px;
  }
`;

const Input = styled.input`
  padding: 15px;
  margin-bottom: 20px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  box-sizing: border-box;
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
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ErrorMessage = styled.p`
  color: red;
`;

const SuccessMessage = styled.p`
  color: green;
`;

const Register = () => {
  const [step, setStep] = useState(1);
  const [emailUser, setEmailUser] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [buttonText, setButtonText] = useState("Send OTP");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    // Prevent the user from typing '@' and beyond
    const value = e.target.value.split("@")[0];
    setEmailUser(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      // Send OTP logic here
      try {
        const response = await axios.post(`${API_BASE_URL}/api/send-otp`, {
          email: emailUser,
        });
        console.log(response.data);
        setStep(2);
        setButtonText("Verify OTP");
        setErrorMessage("");
        setSuccessMessage("OTP sent successfully to your email.");
      } catch (error) {
        if (error.response && error.response.data) {
          // If the account is already registered, display the message and redirect
          if (
            error.response.data.message ===
            "An account already exists with this account"
          ) {
            setErrorMessage(error.response.data.message);
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          } else {
            setErrorMessage(error.response.data.message);
          }
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
        setSuccessMessage("");
      }
    } else if (step === 2) {
      // Verify OTP logic here
      try {
        const response = await axios.post(`${API_BASE_URL}/api/verify-otp`, {
          email: emailUser,
          otp: otp,
        });
        console.log(response.data);
        setStep(3);
        setButtonText("Register");
        setErrorMessage("");
        setSuccessMessage("OTP verified successfully.");
      } catch (error) {
        if (error.response && error.response.data) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("An error occurred during OTP verification.");
        }
        setSuccessMessage("");
      }
    } else if (step === 3) {
      // Registration logic here
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setSuccessMessage("");
        return;
      }

      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
      if (!passwordRegex.test(password)) {
        setErrorMessage(
          "Password must be at least 8 characters long and contain at least one number and one special character."
        );
        setSuccessMessage("");
        return;
      }
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/register`, {
          email: emailUser,
          password: password,
        });
        console.log(response.data);
        setErrorMessage("");
        setSuccessMessage("Registration completed successfully.");
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        if (error.response && error.response.data) {
          // Check for the specific error message returned when an account exists
          if (
            error.response.data.message ===
            "An account already exists with this account"
          ) {
            setErrorMessage(error.response.data.message);
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          } else {
            setErrorMessage(error.response.data.message);
          }
        } else {
          setErrorMessage("An error occurred during registration.");
        }
        setSuccessMessage("");
      }
    }
  };

  return (
    <Container>
      <Content>
        <Heading>Verify Your Account</Heading>
        <Paragraph>Register with your Premier Energies email</Paragraph>
        <Form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <Label htmlFor="email">Email Address</Label>
              <EmailInputContainer>
                <EmailInput
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={emailUser}
                  onChange={handleEmailChange}
                  required
                />
                <FixedText>@premierenergies.com</FixedText>
              </EmailInputContainer>
            </>
          )}

          {step >= 2 && (
            <>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                type="text"
                id="otp"
                name="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </>
          )}

          {step === 3 && (
            <>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Label htmlFor="confirmPassword">Re-enter Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}

          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

          <SubmitButton type="submit">{buttonText}</SubmitButton>
        </Form>
      </Content>
    </Container>
  );
};

export default Register;
