"use client";
import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { bins } from '../../data/trashCatalog';
export function DetectionChart({ data }) {
    return (<div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgb(225 228 222)"/>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(100 108 103)' }}/>
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(100 108 103)' }}/>
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 8, border: '1px solid rgb(225 228 222)', fontSize: 13 }}/>
          
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>
          {bins.map((bin, i) => <Bar key={bin.id} dataKey={bin.id} name={bin.label} stackId="items" fill={bin.color} radius={i === bins.length - 1 ? [3, 3, 0, 0] : 0}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>);
}
