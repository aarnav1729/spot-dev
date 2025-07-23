// Header.js
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import LeftLogo from '../assets/spot.svg';
import RightLogo from '../assets/logo-right.png';
import { FaBell } from 'react-icons/fa';

const HeaderContainer = styled.div`
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  z-index: 1000;
  top: 0;
  padding: 10px 20px;
`;

const LeftSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const LeftLogoStyled = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1001;
  transform: translateY(-50%);
  height: 300px;
`;

const RightLogoStyled = styled.img`
  height: 50px;
  cursor: pointer;
`;

const BellIcon = styled(FaBell)`
  height: 30px;
  width: 30px;
  color: #0f6ab0;
  cursor: pointer;
`;

const Title = styled.h3`
  color: white;
  margin-left: 7px;
  font-family: 'Montserrat', sans-serif;
`;

const Header = () => {
  const navigate = useNavigate();

  const handleLeftLogoClick = () => {
    navigate('/profile');
  };

  const handleRightLogoClick = () => {
    window.location.href = 'https://premierenergies.com';
  };

  const handleBellClick = () => {
    navigate('/notifs');
  };

  // Determine if the user is logged in by checking localStorage
  const isLoggedIn = Boolean(localStorage.getItem("username"));

  return (
    <HeaderContainer>
      <LeftSection onClick={handleLeftLogoClick}>
        <LeftLogoStyled src={LeftLogo} alt="Left Logo" />
      </LeftSection>
      {isLoggedIn ? (
        <BellIcon onClick={handleBellClick} />
      ) : (
        <RightLogoStyled src={RightLogo} alt="Right Logo" onClick={handleRightLogoClick} />
      )}
    </HeaderContainer>
  );
};

export default Header;
