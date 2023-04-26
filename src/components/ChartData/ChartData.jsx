import React, {useState} from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'График заболеваний и смертей',
        },
    },
};



export function ChartData({periodData}) {

    const [selectedCountry, setSelectedCountry] = useState("");
    function handleChange(event) {
        setSelectedCountry(event.target.value);
    }
    const getPeriodData = () => {
        const dailySum = [];


        for (const countryData of periodData.filter((item) => selectedCountry ? item.country === selectedCountry : item)) {
            for (const record of countryData.records) {
                const date = record.dateRep;
                const { cases, deaths } = record;
                const index = dailySum.findIndex(obj => obj && obj.date === date);
                if (index === -1) {
                    dailySum.push({ date, cases: 0, deaths: 0 });
                }
                dailySum[index !== -1 ? index : dailySum.length - 1].cases += cases;
                dailySum[index !== -1 ? index : dailySum.length - 1].deaths += deaths;
            }
        }

        return dailySum
    }


    const data = {
        labels: getPeriodData().map((item) => item.date) ,
        datasets: [
            {
                label: 'Заболевания',
                data: getPeriodData().map((item) => item.cases),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Смерти',
                data: getPeriodData().map((item) => item.deaths),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    return <>
        <div style={{marginLeft: 10}}>
            <FormControl style={{width: '30%'}}>
                <InputLabel id="country">Выбрать страну</InputLabel>
            <Select labelId="country" value={selectedCountry} onChange={handleChange}>
                { periodData.map((item) =>
                    <MenuItem value={item.country}>{item.country}</MenuItem>
                )}
            </Select>
            </FormControl>
        </div>
        <Line options={options} data={data} />
        </>;
}
