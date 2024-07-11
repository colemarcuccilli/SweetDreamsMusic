import React, { useState } from 'react';
import styled from 'styled-components';

const PosterContainer = styled.div`
  background: #1a1a1a;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const PosterTitle = styled.h2`
  color: #ff6b6b;
  text-align: center;
  font-size: 2rem;
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
`;

const DateButton = styled.button`
  background: ${props => props.isAvailable ? '#4ecdc4' : '#45b7d1'};
  color: white;
  border: none;
  padding: 10px;
  cursor: ${props => props.isAvailable ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.isAvailable ? 1 : 0.5};
`;

const BookingPoster = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Simulated available dates
  const availableDates = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

  const handleDateClick = (date) => {
    if (availableDates.includes(date)) {
      setSelectedDate(date);
      // Here you would handle the booking logic
      console.log(`Selected date: ${date}`);
    }
  };

  return (
    <PosterContainer>
      <PosterTitle>Book Your Session</PosterTitle>
      <DateGrid>
        {[...Array(31)].map((_, i) => (
          <DateButton 
            key={i} 
            isAvailable={availableDates.includes(i + 1)}
            onClick={() => handleDateClick(i + 1)}
          >
            {i + 1}
          </DateButton>
        ))}
      </DateGrid>
    </PosterContainer>
  );
};

export default BookingPoster;