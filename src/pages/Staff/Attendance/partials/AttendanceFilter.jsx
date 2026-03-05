import React, { useEffect, useState } from 'react';
import { Row, Col, Select, DatePicker, Radio, Input } from 'antd';
import { getGrades, getSubjects } from '../../../../data/Center/sectionQuery';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const AttendanceFilter = ({
  filterMode, setFilterMode,
  selectedDate, setSelectedDate,
  selectedGrade, setSelectedGrade,
  selectedSubject, setSelectedSubject,
  searchText, setSearchText
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <Row gutter={[16, 16]} align="middle">
        
        {/* Search Bar */}
        <Col xs={24} md={12} lg={8}>
          <Input 
            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
            placeholder="Tìm kiếm tên lớp hoặc học sinh..." 
            allowClear
            size="large"
            className="rounded-xl"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        {/* Toggle between Day and Month */}
        <Col xs={24} sm={12} md={12} lg={4}>
          <Radio.Group 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
            className="flex w-full bg-gray-50 p-1 rounded-xl"
            buttonStyle="solid"
          >
            <Radio.Button value="date" className="flex-1 text-center rounded-lg border-none bg-transparent shadow-none !h-8 leading-8 data-[state=checked]:bg-white data-[state=checked]:shadow-sm">
              Ngày
            </Radio.Button>
            <Radio.Button value="month" className="flex-1 text-center rounded-lg border-none bg-transparent shadow-none !h-8 leading-8 data-[state=checked]:bg-white data-[state=checked]:shadow-sm">
              Tháng
            </Radio.Button>
          </Radio.Group>
        </Col>

        {/* Date Picker */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <DatePicker 
            className="w-full rounded-xl"
            size="large"
            picker={filterMode}
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            format={filterMode === 'date' ? 'DD/MM/YYYY' : 'MM/YYYY'}
            allowClear={false}
          />
        </Col>

        {/* Grade Filter */}
        <Col xs={12} sm={12} md={8} lg={4}>
          <Select 
            className="w-full"
            size="large"
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
        <Col xs={12} sm={12} md={8} lg={4}>
          <Select 
            className="w-full"
            size="large"
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
    </div>
  );
};

export default AttendanceFilter;