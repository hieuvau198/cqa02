import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Radio, Input } from 'antd'; // ADDED Input
import { getGrades, getSubjects } from '../../../../data/Center/sectionQuery';

const { Option } = Select;
const { Search } = Input; // Extract Search component

const AttendanceFilter = ({
  filterMode, setFilterMode,
  selectedDate, setSelectedDate,
  selectedGrade, setSelectedGrade,
  selectedSubject, setSelectedSubject,
  searchText, setSearchText // ADDED PROPS
}) => {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const loadFilterData = async () => {
      const fetchedGrades = await getGrades();
      const fetchedSubjects = await getSubjects();
      setGrades(fetchedGrades);
      setSubjects(fetchedSubjects);
    };
    loadFilterData();
  }, []);

  return (
    <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <Row gutter={[16, 16]} align="middle">
        
        {/* ADDED: Search Bar */}
        <Col xs={24} md={24} lg={8}>
          <Search 
            placeholder="Tên lớp hoặc học sinh" 
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => setSearchText(value)}
          />
        </Col>

        {/* Toggle between Day and Month */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Radio.Group 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
            style={{ width: '100%', textAlign: 'center', display: 'flex' }}
          >
            <Radio.Button value="date" style={{ flex: 1 }}>Ngày</Radio.Button>
            <Radio.Button value="month" style={{ flex: 1 }}>Tháng</Radio.Button>
          </Radio.Group>
        </Col>

        {/* Date Picker */}
        <Col xs={24} sm={12} md={6} lg={4}>
          <DatePicker 
            style={{ width: '100%' }}
            picker={filterMode}
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            format={filterMode === 'date' ? 'DD/MM/YYYY' : 'MM/YYYY'}
            allowClear={false}
          />
        </Col>

        {/* Grade Filter */}
        <Col xs={12} sm={12} md={6} lg={4}>
          <Select 
            style={{ width: '100%' }}
            placeholder="Khối lớp"
            allowClear
            value={selectedGrade}
            onChange={setSelectedGrade}
          >
            {grades.map(g => (
              <Option key={g.id} value={g.id}>{g.name}</Option>
            ))}
          </Select>
        </Col>

        {/* Subject Filter */}
        <Col xs={12} sm={12} md={6} lg={4}>
          <Select 
            style={{ width: '100%' }}
            placeholder="Môn học"
            allowClear
            value={selectedSubject}
            onChange={setSelectedSubject}
          >
            {subjects.map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
        </Col>

      </Row>
    </Card>
  );
};

export default AttendanceFilter;