/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { useUser, useRefresh } from "hooks";
import { report_categories, ReportDescription } from "Report";
import { report_manager } from "report_manager";
import Select from "react-select";
import { _ } from "translate";
import { useParams } from "react-router-dom";
import { SelectedReport } from "./SelectedReport";

const categories: ReportDescription[] = [
    {
        type: "all",
        title: "All",
        description: "",
    } as ReportDescription,
]
    .concat(report_categories)
    .concat([
        {
            type: "appeal",
            title: "Appeals",
            description: "",
        },
    ]);

const category_priorities: { [type: string]: number } = {};
for (let i = 0; i < report_categories.length; ++i) {
    category_priorities[report_categories[i].type] = i;
}

export function ReportsCenter(): JSX.Element {
    const user = useUser();
    const params = useParams();

    const refresh = useRefresh();
    const [selectedTab, setSelectedTab] = React.useState("all");
    const [report, setReport] = React.useState(null);

    React.useEffect(() => {
        report_manager.on("update", refresh);
        return () => {
            report_manager.off("update", refresh);
        };
    }, []);

    React.useEffect(() => {
        const setToFirstAvailableReport = () => {
            const reports = report_manager.getAvailableReports();

            if (reports.length) {
                for (let i = 0; i < reports.length; ++i) {
                    if (reports[i].report_type === selectedTab || selectedTab === "all") {
                        setReport(reports[i]);
                        return;
                    }
                }
            }

            setReport(null);
        };

        setToFirstAvailableReport();

        const syncToFirstAvailableReportIfNotSelected = () => {
            if (!report) {
                setToFirstAvailableReport();
            }
        };

        report_manager.on("update", syncToFirstAvailableReportIfNotSelected);
        return () => {
            report_manager.off("update", syncToFirstAvailableReportIfNotSelected);
        };
    }, [selectedTab]);

    React.useEffect(() => {
        if (report) {
            window.history.replaceState({}, document.title, "/reports-center/" + report.id);
        }
    }, [report]);

    if (params.reportId) {
        // TODO: We should figure out how to load historical reports if
        // this is set when we first come in
    }

    if (!user.is_moderator) {
        return null;
    }

    const reports = report_manager.getAvailableReports();
    const counts = {};
    for (const report of reports) {
        counts[report.report_type] = (counts[report.report_type] || 0) + 1;
        counts["all"] = (counts["all"] || 0) + 1;
    }

    const selectReport = (report) => {
        setReport(report);
    };

    return (
        <div className="ReportsCenter container">
            <h2 className="page-title">
                <i className="fa fa-exclamation-triangle"></i>
                {_("Reports Center")}
            </h2>

            <div id="ReportsCenterContainer">
                <div id="ReportsCenterCategoryList">
                    {categories.map((report_type) => {
                        const ct = counts[report_type.type] || 0;
                        return (
                            <div
                                key={report_type.type}
                                className={
                                    "Category " +
                                    (ct > 0 ? "active" : "") +
                                    (selectedTab === report_type.type ? " selected" : "")
                                }
                                title={report_type.title}
                                onClick={() => setSelectedTab(report_type.type)}
                            >
                                <span className="title">{report_type.title}</span>
                                <span className={"count " + (ct > 0 ? "active" : "")}>
                                    {ct > 0 ? `(${ct})` : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <Select
                    id="ReportsCenterCategoryDropdown"
                    className="reports-center-category-option-select"
                    classNamePrefix="ogs-react-select"
                    value={categories.filter((opt) => opt.type === selectedTab)[0]}
                    getOptionValue={(data) => data.type}
                    onChange={(data: any) => setSelectedTab(data.type)}
                    options={categories}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                            <div
                                ref={innerRef}
                                {...innerProps}
                                className={
                                    "reports-center-category " +
                                    (isFocused ? "focused " : "") +
                                    (isSelected ? "selected" : "")
                                }
                            >
                                {data.title}{" "}
                                {counts[data.type] > 0 ? `(${counts[data.type] || 0})` : ""}
                            </div>
                        ),
                        SingleValue: ({ innerProps, data }) => (
                            <span {...innerProps} className="reports-center-category">
                                {data.title}{" "}
                                {counts[data.type] > 0 ? `(${counts[data.type] || 0})` : ""}
                            </span>
                        ),
                        ValueContainer: ({ children }) => (
                            <div className="reports-center-category-container">{children}</div>
                        ),
                    }}
                />

                <SelectedReport reports={reports} onChange={selectReport} report={report} />
            </div>
        </div>
    );
}
