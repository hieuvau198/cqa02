// src/pages/Admin/Payment/AdminPayment.jsx
import React, { useEffect, useState } from 'react';
import { Space, Typography } from 'antd';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import ClassFilterBar from '../Classes/partials/ClassFilterBar';
import PaymentClassList from './partials/PaymentClassList';

const { Title } = Typography;

export default function AdminPayment() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      const fetchedYears = await ClassQuery.getAllYears();
      setYears(fetchedYears);

      // AUTO-SELECT LOGIC
      const currentYearStr = dayjs().year().toString();
      const matchedYear = fetchedYears.find(y => y.name === currentYearStr);

      if (matchedYear) {
        setSelectedYear(matchedYear);
        const fetchedTerms = await ClassQuery.getTermsByYear(matchedYear.id);
        setTerms(fetchedTerms);

        const currentMonthStr = `Tháng ${dayjs().month() + 1}`;
        const matchedTerm = fetchedTerms.find(t => t.name === currentMonthStr);

        if (matchedTerm) {
          setSelectedTerm(matchedTerm);
          const fetchedClasses = await ClassQuery.getClassesByTerm(matchedTerm.id);
          setClasses(fetchedClasses);
        }
      }
    };
    initializeData();
  }, []);

  const handleSelectYear = async (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setTerms(await ClassQuery.getTermsByYear(year.id));
  };

  const handleSelectTerm = async (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    setClasses(await ClassQuery.getClassesByTerm(term.id));
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Quản lý Học Phí</Title>
        <ClassFilterBar 
          years={years} 
          terms={terms} 
          selectedYear={selectedYear} 
          selectedTerm={selectedTerm}
          handleSelectYear={handleSelectYear} 
          handleSelectTerm={handleSelectTerm}
          isReadOnly={true} // Disable add/edit/delete for year/term on this page
        />

        <PaymentClassList classes={classes} />
      </Space>
    </div>
  );
}