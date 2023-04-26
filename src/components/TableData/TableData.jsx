import React, {useEffect, useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@material-ui/core';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import MomentUtils from "@date-io/moment";
import moment from "moment";
import axios from "axios";

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
}));

const TableData = () => {

    useEffect(() => {
        async function fetchData() {
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
            setData(transformedData);
        }
        fetchData();
    }, [])


    const classes = useStyles();
    const [startDate, setStartDate] = useState('2020-12-10');
    const [endDate, setEndDate] = useState('2020-12-10');
    const [data, setData] = useState([]);

    const filteredData = data.map((item) => ({
        ...item,
        totalCases: item.records.reduce((total, record) => total + record.cases, 0),
        totalDeaths: item.records.reduce((total, record) => total + record.deaths, 0),
        records: item.records.filter(
            (record) => {
               return ( moment(record.dateRep, 'DD/MM/YYYY').isSameOrAfter(startDate) &&
                   moment(record.dateRep, 'DD/MM/YYYY').isSameOrBefore(endDate)
               )
            }
        ),
    })).filter((item) => item.records.length > 0);

    const handleStartDateChange = (date) => {
        setStartDate(date);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
    };

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <div className={classes.root}>
                <DatePicker
                    label="Start Date"
                    format="DD/MM/YYYY"
                    value={startDate}
                    onChange={handleStartDateChange}
                />
                <DatePicker
                    label="End Date"
                    format="DD/MM/YYYY"
                    value={endDate}
                    onChange={handleEndDateChange}
                />
            </div>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Country</TableCell>
                            <TableCell>Cases</TableCell>
                            <TableCell>Deaths</TableCell>
                            <TableCell>Total Cases</TableCell>
                            <TableCell>Total Deaths</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow key={item.country}>
                                <TableCell>{item.country}</TableCell>
                                <TableCell>
                                    {item.records.reduce((total, record) => total + record.cases, 0)}
                                </TableCell>
                                <TableCell>
                                    {item.records.reduce((total, record) => total + record.deaths, 0)}
                                </TableCell>
                                <TableCell>
                                    {item.totalCases}
                                </TableCell>
                                <TableCell>
                                    {item.totalDeaths}
                                </TableCell>
                            </TableRow>
                            ))}
                            </TableBody>
                            </Table>
            </TableContainer>
                </MuiPickersUtilsProvider>
    )}

export default TableData;
