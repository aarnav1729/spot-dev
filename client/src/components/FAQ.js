import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const Container = styled.div`
  display: flex;
  min-height: calc(100vh - 70px); /* Adjusting for header height */
  background-color: #F9F9F9;
`;

const Content = styled.div`
  flex: 1;
  padding: 40px;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #0F6AB0;
  font-size: 36px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: bold;
`;

const FAQSection = styled.div`
  background-color: #FFFFFF;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
  }
`;

const FAQItem = styled.div`
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 1px solid #E0E0E0;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #F1F1F1;
  }
`;

const Question = styled.h3`
  color: #0F6AB0;
  font-size: 24px;
  margin-bottom: 10px;
  font-weight: 600;
  cursor: pointer;
`;

const Answer = styled.p`
  color: #555;
  font-size: 18px;
  line-height: 1.6;
  margin-left: 20px;
`;

const FAQ = () => {
  return (
    <div>
      <Container>
        <Sidebar activeTab="FAQ's" />
        <Content>
          <Title>Frequently Asked Questions</Title>
          <FAQSection>
            <FAQItem>
              <Question>What is SPOT?</Question>
              <Answer>SPOT (Smart Processing of Tickets) is an organization-wide, centralized ticketing tool that allows users to raise, track, and manage tickets efficiently.</Answer>
            </FAQItem>
            <FAQItem>
              <Question>How do I create a new ticket?</Question>
              <Answer>To create a new ticket, click on the "Create Ticket" button in the top right corner of your profile or department page. Fill in the required details and submit.</Answer>
            </FAQItem>
            <FAQItem>
              <Question>How do I log out?</Question>
              <Answer>To log out, click on the "Logout" button located at the bottom of the sidebar.</Answer>
            </FAQItem>
            <FAQItem>
              <Question>Can I view tickets for my entire department?</Question>
              <Answer>No, only your respective HOD can view tickets for your entire department by navigating to the "Department" page from the sidebar.</Answer>
            </FAQItem>
            <FAQItem>
              <Question>What should I do if I encounter an issue with the platform?</Question>
              <Answer>If you encounter any issues with the platform, please contact your nearest SPOT admin, you can find more information on them here: </Answer>
            </FAQItem>
            <FAQItem>
              <Question>How do I assign a ticket to a team member?</Question>
              <Answer>When creating or editing a ticket, you can select the assignee from the dropdown menu under "Assignee's Department". This will allow you to allocate the ticket to the appropriate team member.</Answer>
            </FAQItem>
            <FAQItem>
              <Question>What is the difference between ticket status closed and resolved?</Question>
              <Answer>Once an assignee completes the task/issue assigned to them, they will mark it as resolved, if the user is satisfied, he will accept the resolution and the ticket will be marked as closed. If not, user can reopen the ticket. If neither action is taken by user one week after the task/issue was marked as resolved, the ticket status is automatically marked as closed.</Answer>
            </FAQItem>
          </FAQSection>
        </Content>
      </Container>
    </div>
  );
};

export default FAQ;