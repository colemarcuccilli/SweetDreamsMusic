import React, { useState } from 'react';
import styled from 'styled-components';

const ContactContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const WaveformInput = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #2a2a2a;
  border: none;
  color: white;
  border-radius: 5px;
`;

const WaveformTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #2a2a2a;
  border: none;
  color: white;
  border-radius: 5px;
  height: 150px;
`;

const SubmitButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
  transition: background 0.3s ease;

  &:hover {
    background: #ff8787;
  }
`;

const WaveformContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Here you could add logic to animate a waveform based on input
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <ContactContainer>
      <form onSubmit={handleSubmit}>
        <WaveformInput 
          type="text" 
          name="name" 
          placeholder="Your Name" 
          value={formData.name} 
          onChange={handleChange} 
        />
        <WaveformInput 
          type="email" 
          name="email" 
          placeholder="Your Email" 
          value={formData.email} 
          onChange={handleChange} 
        />
        <WaveformTextarea 
          name="message" 
          placeholder="Your Message" 
          value={formData.message} 
          onChange={handleChange} 
        />
        <SubmitButton type="submit">Send Message</SubmitButton>
      </form>
    </ContactContainer>
  );
};

export default WaveformContact;