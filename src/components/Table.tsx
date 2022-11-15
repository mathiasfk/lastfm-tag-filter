import React from "react"

type Props = {
    headers: string[],
    values: any[][],
}

export default function Table({headers, values}: Props){
    return (
        <table>
            <thead>
            <tr>{headers.map((h, thIndex) => <th key={thIndex}>{h}</th>)}</tr>
            </thead>
            <tbody>
            {
                values.map((row, trIndex) => <tr key={trIndex}>{row.map((v, tdIndex) => <td key={tdIndex}>{v}</td>)}</tr>)
            }
            </tbody>
        </table>
    )
}