// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import * as mt940 from "mt940-js";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function Home() {
  const gridRef = useRef();
  const [transactions, setTransactions] = useState<any>([]);
  const [wrapDescription, setWrapDescription] = useState(false);
  const [columnDefs, setColumnDef] = useState<any>();
  const [filteredDataList, setFilteredDataList] = useState<any>();
  const [showCreditsOrDebits, setShowCreditsOrDebits] = useState("both");

  const extractAndSetTransactionsFromFile = (data: any) => {
    const trn = [];
    for (let d of data) {
      trn.push(...d.transactions);
    }
    setTransactions(trn);
    setFooterData(trn);
  }
  const getAbsAmount = (rawAmount: number, isCredit: boolean) => {
    console.log("isCreditisCreditisCredit", isCredit);
    return Number(isCredit ? Math.abs(rawAmount) : -Math.abs(rawAmount));
  };
  const triggerSetColumnDef = () => {
    console.log("triggered");
    setColumnDef([
      {
        field: "amount",
        sortable: true,
        filter: true,
        valueGetter: (params: any) => {
          return `€ ` + getAbsAmount(params.data.amount, params.data.isCredit);
        },
      },
      {
        field: "description",
        filter: true,
        minWidth: 500,
        wrapText: wrapDescription,
        autoHeight: wrapDescription,
        // resizable: true,
        getQuickFilterText: (params) => {
          return params.value;
        },
      },
      { field: "id", hide: true },
      { field: "entryDate", filter: true, headerName: "Date" },
      // { field: "valueDate", filter: true },
      {
        field: "currency",
        filter: true,
      },
      // { field: "isExpense" },
      {
        field: "isCredit",
        filter: true,
      },
    ]);
    // setTimeout(() => triggerSetGridOptions(), 1000);
    // triggerSetGridOptions();
  };

  useEffect(triggerSetColumnDef, [wrapDescription]);

  if (!transactions) return <p>No profile data</p>;

  const setFooterData = (data) => {
    const { api } = gridRef.current as any;
    const calcTotalCols = ["amount"];

    let result = [
      {
        description: `Total Entries: ${(data).length}`,
      },
    ];
    // initialize all total columns to zero
    calcTotalCols.forEach(function (params) {
      result[0][params] = 0;
    });
    // calculate all total columns
    calcTotalCols.forEach(function (params) {
      (data).forEach(function (line) {
        if (params === "amount") {
          result[0][params] =
            Number(result[0][params]) +
            getAbsAmount(line[params], line.isCredit);
        } else {
          result[0][params] += line[params];
        }
        console.log(
          "result[0][params]result[0][params]",
          Number.parseFloat(result[0][params]).toFixed(2)
        );
        result[0][params] = Number.parseFloat(result[0][params]).toFixed(2);
        result[0].isCredit = result[0][params] >= 0;
      });
    });
    api.setPinnedBottomRowData(result);
  };
  const onGridReady = () => {
    setFooterData(transactions);
    gridRef.current.api.sizeColumnsToFit();
  };

  const resetAllFilters = () => {
    gridRef.current.api.setFilterModel(null);
  };
  const onFilterChanged = () => {
    const { api } = gridRef.current as any;
    let rowData: any = [];
    api.forEachNodeAfterFilter((node) => {
      rowData.push(node.data);
    });

    setFilteredDataList(rowData);
    setFooterData(rowData);
  };
  const dropHandler = (e) => {
    let event = e as Event;
    event.stopPropagation();
    event.preventDefault();

    if (event.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...event.dataTransfer.items].forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile();
          console.log(`111 … file[${i}].name = ${file.name}`);
          processFile(file)
        }
      });
    } else {
      // Use DataTransfer interface to access the file(s)
      [...event.dataTransfer.files].forEach((file, i) => {
        processFile(file)
        console.log(`… file[${i}].name = ${file.name}`);
        processFile(file)
      });
    }

    return false;
  }

  const processFile = (file: any) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      console.log(event.target.result);
      mt940.read(event.target.result).then(extractAndSetTransactionsFromFile);
    };
    reader.readAsArrayBuffer(file);
  }
  const dragOverHandler = (e) => {
    let event = e as Event;
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
  return (
    <div id="drop_zone" onDrop={(e) => dropHandler(e)} onDragOver={(e) => dragOverHandler(e)}>
      <div
        style={{ height: "20vh", border: "1px solid black", marginBottom: 10 }}
      >
        <div>
          <input
            type="checkbox"
            id="vehicle1"
            name="vehicle1"
            value="Bike"
            onChange={() => setWrapDescription(!wrapDescription)}
          />
          <label htmlFor="vehicle1">Wrap Description</label>
        </div>
        <div>
          {/* <label for="pet-select">Choose a pet:</label> */}
          <select name="pets" id="pet-select">
            <option value="dog">Show Credits and Debits</option>
            <option value="cat">Show credits only</option>
            <option value="hamster">Show debits only</option>
          </select>
        </div>
        <button onClick={resetAllFilters}>reset all filters</button>
      </div>
      <div className="ag-theme-alpine" style={{ height: "60vh" }}>
        {
          <AgGridReact
            ref={gridRef}
            rowData={transactions}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onFilterChanged={onFilterChanged}
          ></AgGridReact>
        }
      </div>
    </div>
  );
}
