import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import RegisterVideo from '../assets/right.mp4';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 70px); /* Adjusting for header height */
  background-color: #FFFFFF;
`;

const BackgroundImage = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 70px; /* Adjust for header height */
    left: 0;
    right: 0;
    bottom: 0;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: -1; /* Place it behind other content */
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftHalf = styled.div`
  flex: 1;
  padding: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 768px) {
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.8); /* Semi-transparent background */
    position: relative;
    z-index: 1; /* Ensure content is above the background */
  }
`;

const RightHalf = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    display: none; /* Hide on mobile screens */
  }
`;

const Heading = styled.h1`
  color: #0F6AB0;
  font-size: 48px;
  @media (max-width: 768px) {
    font-size: 36px;
    text-align: center;
    margin-top: 20px; /* Adjusted to prevent overflow */
  }
`;

const Paragraph = styled.p`
  color: #000000;
  font-size: 18px;
  margin: 20px 0;
  font-family: 'Montserrat', sans-serif;
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const ButtonText = styled.p`
  color: #61B847;
  font-size: 16px;
  margin: 10px 0 5px;
  text-align: center;
`;

const Button = styled.button`
  background-color: #0F6AB0;
  font-family: 'Montserrat', sans-serif;
  color: #FFFFFF;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;
  width: 200px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 20px;
  }
`;

const RegisterVideoStyled = styled.video`
  width: 100%;
  max-width: 600px;
  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  const handleVerifyAccount = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Container>
      <BackgroundImage />
      <Content>
        <LeftHalf>
          <Heading>Welcome to SPOT</Heading>
          <Paragraph>
            SPOT (Smart Processing Of Tickets) is an organization-wide, centralized ticketing tool. This tool will allow users to login using their company email and raise tickets. SPOT will track the complete lifecycle of a ticket and help minimise response time.
          </Paragraph>
          <ButtonContainer>
            <ButtonGroup>
              <ButtonText>First Time User?</ButtonText>
              <Button onClick={handleVerifyAccount}>Verify Account</Button>
            </ButtonGroup>
            <ButtonGroup>
              <ButtonText>Already Registered?</ButtonText>
              <Button onClick={handleLogin}>Login</Button>
            </ButtonGroup>
          </ButtonContainer>
        </LeftHalf>
        <RightHalf>
          <RegisterVideoStyled src={RegisterVideo} type="video/mp4" autoPlay loop muted />
        </RightHalf>
      </Content>
    </Container>
  );
};

export default LandingPage;