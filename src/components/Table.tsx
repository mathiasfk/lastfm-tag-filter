import React from "react"

type Props = {
    headers: string[],
    values: string[][],
}

export default function Table({headers, values}: Props){
    return (
        <table>
            <thead>
            <tr>{headers.map(h => <th>{h}</th>)}</tr>
            </thead>
            <tbody>
            {
                values.map(row => <tr>{row.map(v => <td>{v}</td>)}</tr>)
            }
            </tbody>
        </table>
    )
}