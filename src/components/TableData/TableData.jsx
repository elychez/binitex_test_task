import React, { useEffect, useMemo, useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, TableContainer} from '@material-ui/core';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import MomentUtils from "@date-io/moment";
import moment from "moment";
import axios from "axios";
import {DataGrid} from "@mui/x-data-grid";
import {Input} from "@mui/material";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {ChartData} from "../ChartData/ChartData";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import {CustomNoRowsOverlay} from "../utils/utils";

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
        },
        "& .MuiTablePagination-caption[id]": {
            [theme.breakpoints.up("sm")]: {
                display: "block"
            }
        },
        "& .MuiTablePagination-input": {
            [theme.breakpoints.up("sm")]: {
                display: "block"
            }
        }
    },
}));

const TableData = () => {

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const {data} = await axios('https://opendata.ecdc.europa.eu/covid19/casedistribution/json/');
            const groupedData = data.records.reduce((groups, item) => {
                const groupsArray = Array.isArray(groups) ? groups : [groups];
                let group = groupsArray.find(group => group.country === item.countriesAndTerritories);
                if (!group) {
                    group = {
                        country: item.countriesAndTerritories,
                        records: [],
                        totalDeaths: 0,
                        totalCases: 0
                    };
                    groupsArray.push(group);
                }
                group.records.push({cases: item.cases, deaths: item.deaths, dateRep: item.dateRep});
                group.totalDeaths += item.deaths;
                group.totalCases += item.cases;
                return groupsArray;
            }, []);

            const transformedData = groupedData.map(group => {
                return {
                    country: group.country,
                    records: group.records,
                    totalDeaths: group.totalDeaths,
                    totalCases: group.totalCases
                };
            });
            setTableData(transformedData);
            setLoading(false)
        }
        fetchData();
    }, [])


    const classes = useStyles();
    const [startDate, setStartDate] = useState('2019-12-31');
    const [endDate, setEndDate] = useState('2020-12-14');
    const [tableData, setTableData] = useState([]);
    const [filters, setFilters] = useState({
        minValue: '',
        maxValue: '',
        countrySearched: ''
    })
    const [loading, setLoading] = useState(false)
    const [selectedOption, setSelectedOption] = useState("");
    const [chartMode, setChartMode] = useState(false)

    const filteredData = useMemo(() => {
        return tableData.map((item) => ({
            ...item,
            totalCases: item.records.reduce((total, record) => total + record.cases, 0),
            totalDeaths: item.records.reduce((total, record) => total + record.deaths, 0),
            records: item.records.filter((record) => {
                return (
                    moment(record.dateRep, "DD/MM/YYYY").isSameOrAfter(startDate) &&
                    moment(record.dateRep, "DD/MM/YYYY").isSameOrBefore(endDate)
                );
            }),
        }));
    }, [tableData, startDate, endDate]);


    const handleStartDateChange = (date) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };


    const columns = [
        { field: 'country', headerName: 'Страна', width: 130 },
        { field: 'cases', headerName: 'Количество случаев', width: 200 },
        { field: 'deaths', headerName: 'Количество смертей', width: 200 },
        { field: 'totalCases', headerName: 'Количество случаев всего', width: 200 },
        { field: 'totalDeaths', headerName: 'Количество смертей всего', width: 200 },
        { field: 'casesOn1000', headerName: 'Количество случаев на 1000 жителей', width: 270 },
        { field: 'deathsOn1000', headerName: 'Количество смертей на 1000 жителей', width: 270 },
    ];

    const rows = filteredData.map((item) => ({
        id: item.country,
        country: item.country,
        cases: item.records.reduce((total, record) => total + record.cases, 0),
        deaths: item.records.reduce((total, record) => total + record.deaths, 0),
        totalCases: item.totalCases,
        totalDeaths: item.totalDeaths,
        casesOn1000: item.records.reduce((total, record) => total + record.cases, 0)/1000,
        deathsOn1000: item.records.reduce((total, record) => total + record.deaths, 0)/1000
    })).filter((item) => selectedOption ? (item[selectedOption] >= filters.minValue && item[selectedOption]
        <= filters.maxValue) && item.country.toLowerCase().includes(filters.countrySearched.toLowerCase()) :
        item.country.toLowerCase().includes(filters.countrySearched.toLowerCase()));

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    }

    const handleReset = () => {
        setFilters({
            countrySearched: '',
            minValue: '',
            maxValue: ''
        });
    }

    const handleChangeMode = () => {
        setChartMode(!chartMode)
    }

    return (
        <>
            <div>
            <button style={{marginLeft: 10}} onClick={handleChangeMode}>{chartMode ? 'Таблица' : 'График'}</button>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <div className={classes.root}>
                    <DatePicker
                        label="Начальная дата"
                        format="DD/MM/YYYY"
                        minDate={'2019-12-31'}
                        maxDate={endDate}
                        value={startDate}
                        onChange={handleStartDateChange}
                    />
                    <DatePicker
                        label="Конечная дата"
                        format="DD/MM/YYYY"
                        minDate={startDate}
                        maxDate={'2020-12-14'}
                        value={endDate}
                        onChange={handleEndDateChange}
                    />
                </div>
            </MuiPickersUtilsProvider>
            </div>
            { !chartMode ?
                <div>
                <div className={classes.root} style={{marginBottom: 15}}>
                <Input
                    type="number"
                    name="minValue"
                    placeholder="Значение от"
                    value={filters.minValue}
                    onChange={handleFilterChange}
                    style={{marginLeft: 10}}
                />
                <Input
                    type="number"
                    name="maxValue"
                    placeholder="Значение до"
                    value={filters.maxValue}
                    onChange={handleFilterChange}
                    style={{marginLeft: 20}}
                />
            </div>
            <div>
                <Input
                    type="text"
                    name="countrySearched"
                    value={filters.countrySearched}
                    onChange={handleFilterChange}
                    placeholder="Поиск страны"
                    style={{marginLeft: 10, marginBottom: 10}}
                />
            </div>
            <div style={{marginBottom: 15, marginLeft: 10}}>
                <FormControl style={{width: '30%'}}>
                <InputLabel id="filterOption">Выбрать фильтр</InputLabel>
                <Select labelId="filterOption" label="Выбрать фильтр" value={selectedOption} onChange={handleChange}>
                    <MenuItem value="cases">Количество случаев</MenuItem>
                    <MenuItem value="deaths">Количество смертей</MenuItem>
                    <MenuItem value="totalCases">Количество случаев всего</MenuItem>
                    <MenuItem value="totalDeaths">Количество смертей всего</MenuItem>
                    <MenuItem value="casesOn1000">Количество случаев на 1000 жителей</MenuItem>
                    <MenuItem value="deathsOn1000">Количество смертей на 1000 жителей</MenuItem>
                </Select>
                </FormControl>
            </div>
            <div>
                <button onClick={handleReset} style={{marginBottom: 15, marginLeft: 10}}>Сбросить</button>
            </div>
                    <TableContainer component={Paper}>
                <DataGrid
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    columns={columns}
                    rows={rows}
                    pagination
                    pageSizeOptions={[10, 20, 50]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 20, page: 0 },
                        },
                    }}
                    pageSize={20}
                    loading={loading}
                    autoHeight={true}
                />
            </TableContainer>
            </div> :
        <ChartData  startDateData={tableData} periodData={filteredData} startDate={startDate} endDate={endDate}/>}
        </>
    )}

export default TableData;
