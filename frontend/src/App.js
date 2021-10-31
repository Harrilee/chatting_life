import React from 'react';
import * as d3 from 'd3';
import * as d3_time from 'd3-time';
import {Layout, Card, Row, Col, Spin, Progress, Form, Select, Button} from 'antd';
import './App.css';
import 'antd/dist/antd.css';
import * as moment from 'moment';
import {CaretRightOutlined, PauseOutlined, StepBackwardOutlined} from '@ant-design/icons';

const {Header, Content, Footer} = Layout;
const CONTENT_WIDTH = 1600
const ANTI_SHAKE = 0
const TRANSITION_DELAY = 0
const GROUP_NAMES = ['Friends', 'College classmates', 'Other classmates', 'Family', 'Teachers', 'Others']
const DURATION = 250;

function App() {

    function Loading() {
        const progress = 100;
        return (
            <div>
                <img src={process.env.PUBLIC_URL + 'chatting_life_logo.png'} className={'logo'} id={'loadingImg'}
                     alt={'Logo'}
                     style={{
                         position: 'absolute',
                         top: '30%',
                         left: '50%',
                         transform: 'translate(-50%,-50%)',
                         height: '72px',
                         opacity: progress < 100 ? Math.max(progress * 0.015 - 0.1, 0) :
                             (-Math.abs(progress - 100) + 100) / 100
                     }}/>
                <Spin tip="Loading data..." style={{
                    position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%,-50%)',
                    opacity: (-Math.abs(progress - 100) + 100) / 100
                }}/>
                <Progress percent={progress >= 100 ? 100 : progress} status="active" style={{
                    position: 'absolute',
                    top: '75%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: '40%',
                    opacity: (-Math.abs(progress - 100) + 100) / 100
                }}/>
            </div>
        )
    }

    function useData(csvPath) {
        const [dataAll, setData] = React.useState(null);
        React.useEffect(() => {
            if (dataAll === null) {
                d3.csv(csvPath).then(data => {
                    data.forEach(d => {
                        d.is_send = +d.is_send;
                        d.time = moment(d.time, 'x')
                    });
                    setData(data);
                });
            }
        });
        return dataAll;
    }

    function TotalMessage(props) {
        function ToolTip(props) {
            const {x, y, msg, date, opacity} = props.attr
            const height = 70
            const width = 120
            return (
                <div className={'tooltip'} style={{
                    left: x - width - 10,
                    top: y - height - 10,
                    width: width,
                    height: height,
                    opacity: opacity,
                    fontSize: 12,
                }}>
                    Date: {date}<br/>
                    Messages: {msg}<br/>
                    Week: {moment(date, 'YYYY-MM-DD').format('ddd')}
                </div>
            )
        }

        function TootipArea(props) {
            const {msg, date, opacity} = props.attr;
            const xScale = props.xScale;
            const yScale = props.yScale;
            return (
                <div style={{
                    position: "relative",
                    left: xScale(date) + MARGIN_LEFT - 6,
                    top: yScale(msg) - HEIGHT - 10,
                    borderRadius: "5px",
                    border: 'white 2px solid',
                    backgroundColor: '#91a8f9',
                    width: 10,
                    height: 10,
                    opacity: opacity,
                    transition: 'opacity 0.5s',
                    boxShadow: '2px 2px 2px grey',
                    fontSize: 12,
                }}>
                </div>
            )
        }

        const {
            rangeByWeek,
            rangeByMonth,
            rangeByYear,
            weeks,
            conversations,
            filter_setDateRange,
            filter_dateRange
        } = props
        const WIDTH = CONTENT_WIDTH - 100;
        const HEIGHT = 200;
        const MARGIN_LEFT = 25;
        //const minDate = moment.min(dataAll.map(d => d.time));
        const heatWidth = Math.min((WIDTH - MARGIN_LEFT) / rangeByWeek.length - 1, HEIGHT / 5 * 3 / 7)

        const [selectedAttr, setSelectedAttr] = React.useState({
            x: 0,
            y: 0,
            date: 0,
            msg: 0,
            opacity: 0
        })

        const xScale = d3.scaleBand()
            .domain(conversationData.map(d => d.date))
            .range([0, WIDTH - MARGIN_LEFT])
        const xScaleReverse = d3.scaleQuantize()
            .domain([0, WIDTH - MARGIN_LEFT])
            .range(conversationData.map(d => d.date))
        const colorSacle = d3.scalePow()
            .domain([0, d3.max(conversationData, d => d.msg)])
            .range([90, 50])
            .exponent(0.5)
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(conversationData, d => d.msg)])
            .range([HEIGHT / 5, 0])
        const areaPath = d3.area()
            .x(d => xScale(d.date))
            .y0(HEIGHT / 5)
            .y1(d => yScale(d.msg))
            .curve(d3.curveCardinal)
            (conversationData)
        const yScaleHeat = d3.scaleBand()
            .domain(weeks)
            .range([0, HEIGHT / 5 * 3])
        const yScaleHeatReverse = d3.scaleQuantize()
            .domain([0, HEIGHT / 5 * 3])
            .range(weeks)


        React.useEffect(() => {
            d3.select('#heatmap')
                .call(d3.brush()
                    .on('brush', (e) => {
                        const range = e.selection;
                        var daterange = [];
                        d3.selectAll('.heatRect')
                            .filter((d, i, node) => {
                                try {
                                    if (node !== null && i != null && node[i] !== null &&
                                        +node[i].getAttribute('x') + heatWidth >= range[0][0] &&
                                        +node[i].getAttribute('x') <= range[1][0] &&
                                        +node[i].getAttribute('y') + heatWidth >= range[0][1] &&
                                        +node[i].getAttribute('y') <= range[1][1]) {
                                        daterange.push(node[i].getAttribute('id'))
                                        return true
                                    }
                                    return false
                                } catch (error) {
                                    return false
                                }
                            })
                            .attr('fill', (d, i, node) => {
                                const msg = conversations[node[i].getAttribute('id')];
                                return `hsl(262,68%,${colorSacle(msg)}%)`
                            });
                        d3.selectAll('.heatRect')
                            .filter((d, i, node) => {
                                try {
                                    if (node !== null && i != null && node[i] !== null &&
                                        +node[i].getAttribute('x') + heatWidth >= range[0][0] &&
                                        +node[i].getAttribute('x') <= range[1][0] &&
                                        +node[i].getAttribute('y') + heatWidth >= range[0][1] &&
                                        +node[i].getAttribute('y') <= range[1][1]) {
                                        return false
                                    }
                                    return true
                                } catch (error) {
                                    return true
                                }
                            })
                            .attr('fill', (d, i, node) => {
                                const msg = conversations[node[i].getAttribute('id')];
                                return `hsl(220,62%,${colorSacle(msg)}%)`
                            });
                        if (JSON.stringify(daterange) !== JSON.stringify(filter_dateRange)) {
                            setTimeout(() => {
                                filter_setDateRange(daterange)
                            }, ANTI_SHAKE)
                        }

                    })
                    .on('end', e => {
                        const range = e.selection;
                        var daterange = [];
                        d3.selectAll('.heatRect')
                            .filter((d, i, node) => {
                                try {
                                    if (node !== null && i != null && node[i] !== null &&
                                        +node[i].getAttribute('x') + heatWidth >= range[0][0] &&
                                        +node[i].getAttribute('x') <= range[1][0] &&
                                        +node[i].getAttribute('y') + heatWidth >= range[0][1] &&
                                        +node[i].getAttribute('y') <= range[1][1]) {
                                        daterange.push(node[i].getAttribute('id'))
                                        return true
                                    }
                                    return false
                                } catch (error) {
                                    return false
                                }
                            })
                        if (daterange.length === 0) {
                            setTimeout(() => {
                                filter_setDateRange(null);
                            }, ANTI_SHAKE)
                            d3.select('#area_mask')
                                .remove();
                        }
                    })
                )
            if(filter_dateRange!==null){
                const momentDateRange = filter_dateRange.map(d => moment(d, 'YYYY-MM-DD'))
                const areaMaskPath = d3.area()
                    .x(d => xScale(d.date))
                    .y0(HEIGHT / 5)
                    .y1(d => {
                        return moment(d.date, 'YYYY-MM-DD').isBetween(
                            moment.min(momentDateRange),
                            moment.max(momentDateRange)
                        ) ? yScale(d.msg) : HEIGHT / 5
                    })
                    .curve(d3.curveCardinal)
                    (conversationData);
                d3.select('#area_mask')
                    .remove();
                d3.select('#group_area')
                    .append('path')
                    .attr('d', areaMaskPath)
                    .attr('fill', '#8c5ae0')
                    .attr('id', 'area_mask');
            }
        })


        return (
            <>
                <svg width={WIDTH + heatWidth / 2} height={HEIGHT}>
                    <g transform={`translate(${MARGIN_LEFT},${0})`} id={'group_area'}
                       onMouseMove={e => {
                           setSelectedAttr({
                               x: e.pageX,
                               y: e.pageY,
                               date: xScaleReverse(e.pageX - (window.innerWidth - WIDTH) / 2),
                               msg: conversations[xScaleReverse(e.pageX - (Math.max((window.innerWidth - WIDTH) / 2, 0)))],
                               opacity: 1
                           })
                       }}
                       onMouseLeave={(e) => setSelectedAttr({
                           x: e.pageX,
                           y: e.pageY,
                           date: 0,
                           msg: 0,
                           opacity: 0
                       })}>
                        <rect height={HEIGHT / 5} width={WIDTH - MARGIN_LEFT + heatWidth / 2} stroke={'black'}
                              strokeWidth={0.5}
                              fill={'white'}/>
                        <path d={areaPath} fill={'#84ABFC'} id={'areaPath'}/>
                        {
                            rangeByMonth.map(d => {
                                const month = moment(d).format('MMM')
                                const date = moment(d).format('YYYY-MM-DD')
                                return (
                                    <g id={rangeByMonth.indexOf(d)}>
                                        <text transform={`translate(${xScale(date)},${HEIGHT / 5 + 15})`}
                                              fontSize={11}
                                              textAnchor={'middle'} fontWeight={100} id={date + 'text'}>
                                            {month}
                                        </text>
                                        <line transform={`translate(${xScale(date)},${HEIGHT / 5})`} x1={0} x2={0}
                                              y1={0} y2={2} stroke={'black'} strokeWidth={0.5} id={date + 'line'}/>
                                    </g>
                                )
                            })
                        }
                        {
                            rangeByYear.map(d => {
                                const year = moment(d).format('YYYY')
                                const date = moment(d).format('YYYY-MM-DD')
                                return (
                                    <text transform={`translate(${xScale(date)},${HEIGHT / 5 + 30})`} fontSize={11}
                                          textAnchor={'middle'} fontWeight={100} id={date}>
                                        {year}
                                    </text>
                                )
                            })
                        }
                    </g>
                    <g transform={`translate(${MARGIN_LEFT},${HEIGHT / 5 * 2})`}>
                        <rect height={HEIGHT / 5 * 3} width={WIDTH - MARGIN_LEFT + heatWidth / 2} stroke={'black'}
                              strokeWidth={0.5}
                              fill={'white'}/>
                        <g id={'heatmap'} onMouseMove={e => {
                            const week = weeks.indexOf(yScaleHeatReverse(e.pageY - 214)) + 1
                            const date = moment(
                                xScaleReverse(e.pageX - (window.innerWidth - WIDTH) / 2 + heatWidth / 3), 'YYYY-MM-DD'
                            ).day(week).format('YYYY-MM-DD');
                            setSelectedAttr({
                                x: e.pageX,
                                y: e.pageY,
                                date: date,
                                msg: conversations[date],
                                opacity: 1
                            })
                        }}
                           onMouseLeave={(e) => setSelectedAttr({
                               x: e.pageX,
                               y: e.pageY,
                               date: 0,
                               msg: 0,
                               opacity: 0
                           })}>
                            {
                                conversationData.map(d => {
                                    const week = moment(d.date).format('ddd')
                                    const dateFloor = moment(d3_time.timeMonday.floor(moment(d.date).toDate())).format('YYYY-MM-DD')
                                    const date = moment(d.date).format('YYYY-MM-DD')
                                    return (
                                        <rect width={heatWidth}
                                              height={heatWidth}
                                              className={'heatRect'}
                                              fill={filter_dateRange === null || !filter_dateRange.includes(d.date)
                                                  ? `hsl(220,62%,${colorSacle(d.msg)}%)` : `hsl(262,68%,${colorSacle(d.msg)}%)`}
                                              x={xScale(dateFloor) === undefined ? -100 : xScale(dateFloor) - heatWidth / 3}
                                              y={yScaleHeat(week) + 2}
                                              id={date}
                                        />
                                    )
                                })
                            }
                        </g>
                        {
                            weeks.map(week => {
                                return (
                                    <text transform={`translate(-4,${yScaleHeat(week) + 10})`} fontSize={11}
                                          textAnchor={'end'} fontWeight={100} id={week}>
                                        {week}
                                    </text>
                                )
                            })
                        }
                    </g>
                </svg>
                <ToolTip attr={selectedAttr}/>
                <TootipArea attr={selectedAttr} xScale={xScale} yScale={yScale}/>
            </>
        )
    }

    function Group(props) {
        const {
            filter_setGroup,
            filter_group,
            filter_dateRange,
            message_tree,
            filter_app
        } = props
        const WIDTH = 450;
        const HEIGHT = 250;
        const radius = Math.min(WIDTH, HEIGHT) / 2;
        let groupInfo = {};
        let totalMsg = 0
        Object.keys(message_tree).forEach(d => { //date, string format
            if (d !== 'count' && (filter_dateRange === null || filter_dateRange.includes(d))) {
                Object.keys(message_tree[d]).forEach(e => {//app
                    if (e !== 'count' && (filter_app === null || filter_app === e)) {
                        Object.keys(message_tree[d][e]).forEach(f => {//group
                            if (f !== 'count') {
                                if (groupInfo[f] === undefined) {
                                    groupInfo[f] = message_tree[d][e][f].count;
                                } else {
                                    groupInfo[f] += message_tree[d][e][f].count;
                                }
                                totalMsg += message_tree[d][e][f].count;
                            }
                        })
                    }
                })
            }
        })
        React.useEffect(() => {

            let color = [
                '#6e9dfc',
                '#83cacb',
                '#86cb79',
                '#f1d754',
                '#d9697b',
                '#a175e6'
            ];
            let pie = d3.pie().padAngle(.2)
                .sortValues(null)
                .sort(null)
            let arc = d3.arc()
                .innerRadius(radius - 40)
                .outerRadius(radius - 20)
                .padRadius(10);

            let svg = d3.select('#group_svg_g')

            let group_names = GROUP_NAMES
            const arcs = pie(group_names.map(d => {
                return groupInfo[d]
            }))
            let arcVal = {}
            let path = svg.selectAll("path")
                .data(arcs)
                .enter()
                .append("path")
                .attr("fill", function (d, i) {
                    return color[i];
                })
                .attr("d", arc)
                .each(function (d, i) {
                    this._current = d;
                    const aLegend = svg.append('g')
                        .attr('transform', `translate(200,${20 * i - 60})`)
                    aLegend.append('rect')
                        .attr('width', 15)
                        .attr('height', 15)
                        .attr('fill', color[i])
                    aLegend.append('text')
                        .attr('transform', 'translate(20,9)')
                        .attr('font-size', 12)
                        .attr('font-weight', 150)
                        .text(group_names[+i])
                })
                .on('mousemove', function (d, e) {
                    d3.select('.group_tooltip')
                        .remove();
                    d3.select('#group_tooltip')
                        .append('div')
                        .style('position', 'fixed')
                        .style('left', `${d.pageX + 20}px`)
                        .style('top', `${d.pageY + 20}px`)
                        .style('padding', '10px')
                        .attr('class', 'group_tooltip')
                        .html(group_names[e.index] + '<br/>' + e.data ? `${e.data} messages,
                        ${Math.round(e.data / totalMsg * 10000) / 100}%` : 'No message');
                })
                .on('mouseout', function (d) {
                    d3.select('.group_tooltip')
                        .remove();
                })
                .on('click', function (event, data) {
                    filter_setGroup(group_names[data.index])
                })

            d3.select('#group_background')
                .on('click', () => {
                    filter_setGroup(null)
                })

            svg.selectAll("path")
                .data(arcs)
                .transition().delay(TRANSITION_DELAY).duration(DURATION * 3)
                .attrTween("d", arcTween)
                .attr('fill', (d, i) => {
                    if (filter_group === null) {
                        return color[i]
                    } else if (filter_group === group_names[i]) {
                        return color[i]
                    }
                    return 'lightgrey'
                });
            svg.selectAll("rect")
                .transition().delay(TRANSITION_DELAY).duration(DURATION * 3)
                .attr('fill', (d, i) => {
                    if (filter_group === null) {
                        return color[i]
                    } else if (filter_group === group_names[i]) {
                        return color[i]
                    }
                    return 'lightgrey'
                });

            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function (t) {
                    return arc(i(t));
                };
            }

            if (d3.select('#group_svg .central_text text').empty()) {
                d3.select('#group_svg .central_text')
                    .append('text')
                    .text('Total Message')
                    .attr('transform', 'translate(0,-5)')
                    .attr('font-size', 12)
                    .attr('font-weight', 180)
                    .attr('text-anchor', 'middle')
            }
            let count = d3.select('#group_svg .central_text #text_count');
            if (count.empty()) {
                d3.select('#group_svg .central_text')
                    .append('text')
                    .attr('id', 'text_count')
                    .attr('font-size', 32)
                    .attr('font-weight', 300)
                    .attr('transform', 'translate(0,45)')
                    .attr('text-anchor', 'middle')
                    .text('0')
            }
            count = d3.select('#group_svg .central_text #text_count');
            const historyTotMsg = +document.getElementById('text_count').innerHTML.replace(',', '')

            count.transition().duration(DURATION * 3)
                .tween('text', function () {
                    let i = d3.interpolateNumber(historyTotMsg, totalMsg)
                    return function (t) {
                        this.innerHTML = d3.format(',')(Math.round(i(t)))
                    }
                })
        })
        return (
            <>
                <div id={'group_tooltip'}></div>
                <svg width={WIDTH} height={HEIGHT} id={'group_svg'}>
                    <rect id={'group_background'} width={WIDTH} height={HEIGHT} fill={'#ffffff'}/>
                    <g className={'group_svg'} transform={`translate(${radius + 10},${radius})`}/>
                    <g id={'group_svg_g'} transform={`translate(${radius},${radius})`}/>
                    <g className={'central_text'} transform={`translate(${radius},${radius * 0.82})`}/>
                </svg>
            </>

        )
    }

    function Apps(props) {
        const {
            filter_app,
            filter_setApp,
            filter_dateRange,
            message_tree,
            totalMsgApp,
            filter_group,
            filter_friend
        } = props
        const WIDTHRAW = 200
        const LEGENDWIDTH = 10
        const WIDTH = WIDTHRAW - 50;
        const HEIGHT = 250;
        const marginTop = 0;
        const marginBottom = 20;
        let appInfo = {Q: {send: 0, receive: 0}, W: {send: 0, receive: 0}};
        Object.keys(message_tree).forEach(d => { //date, string format
            if (d !== 'count' && (filter_dateRange === null || filter_dateRange.includes(d))) {
                Object.keys(message_tree[d]).forEach(e => {//app
                    if (e !== 'count') {
                        Object.keys(message_tree[d][e]).forEach(f => {//group
                            if (f !== 'count' && (filter_group === null || filter_group === f)) {
                                Object.keys(message_tree[d][e][f]).forEach(g => {//friend
                                    if (g !== 'count' && (filter_friend === null || filter_friend === g)) {
                                        Object.keys(message_tree[d][e][f][g]).forEach(h => {//time
                                            if (h !== 'count') {
                                                Object.keys(message_tree[d][e][f][g][h]).forEach(i => {//is_send
                                                    if (i !== 'count') {
                                                        if (appInfo[e] === undefined) {
                                                            appInfo[e] = {}
                                                        }
                                                        if (appInfo[e][i] === undefined) {
                                                            appInfo[e][i] = message_tree[d][e][f][g][h][i].count;
                                                        } else {
                                                            appInfo[e][i] += message_tree[d][e][f][g][h][i].count;
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
        // console.log(appInfo, totalMsgApp)
        React.useEffect(() => {

            let yScale = d3.scaleLinear()
                .range([0, HEIGHT - marginTop - marginBottom])
                .domain([0, Math.max(appInfo.Q.send + appInfo.Q.receive, appInfo.W.send + appInfo.W.receive)])
                .nice()
            let yAxis = d3.axisLeft(
                d3.scaleLinear()
                    .range([HEIGHT - marginTop - marginBottom, 10])
                    .domain([0, Math.max(appInfo.Q.send + appInfo.Q.receive, appInfo.W.send + appInfo.W.receive)])
                    .nice()
            ).ticks(5)
            d3.select('#app_QS')
                .on('mousemove', function (d, e) {
                    d3.select('.app_tooltip')
                        .remove();
                    d3.select('#app_tooltip')
                        .append('div')
                        .style('position', 'fixed')
                        .style('left', `${d.pageX + 20}px`)
                        .style('top', `${d.pageY + 20}px`)
                        .style('padding', '10px')
                        .attr('class', 'app_tooltip')
                        .html(`Total: ${appInfo.Q.send + appInfo.Q.receive}<br/>Send: ${appInfo.Q.send}`);
                })
                .on('mouseout', function (d) {
                    d3.select('.app_tooltip')
                        .remove();
                })
                .transition().duration(DURATION)
                .attr('x', WIDTH / 4)
                .attr('y', HEIGHT - marginBottom - yScale(appInfo.Q.send))
                .attr('width', WIDTH / 4)
                .attr('height', yScale(appInfo.Q.send))
                .attr('fill', (filter_app === null || filter_app === 'Q') ? '#84abfc' : 'lightgrey')

            d3.select('#app_QR')
                .on('mousemove', function (d, e) {
                    d3.select('.app_tooltip')
                        .remove();
                    d3.select('#app_tooltip')
                        .append('div')
                        .style('position', 'fixed')
                        .style('left', `${d.pageX + 20}px`)
                        .style('top', `${d.pageY + 20}px`)
                        .style('padding', '10px')
                        .attr('class', 'app_tooltip')
                        .html(`Total: ${appInfo.Q.send + appInfo.Q.receive}<br/>Receive: ${appInfo.Q.receive}`);
                })
                .on('mouseout', function (d) {
                    d3.select('.app_tooltip')
                        .remove();
                })
                .transition().duration(DURATION)
                .attr('x', WIDTH / 4)
                .attr('y', HEIGHT - marginBottom - yScale(appInfo.Q.receive) - yScale(appInfo.Q.send))
                .attr('width', WIDTH / 4)
                .attr('height', yScale(appInfo.Q.receive))
                .attr('fill', (filter_app === null || filter_app === 'Q') ? '#6dc0c2' : 'lightgrey')

            d3.select('#app_WS')
                .on('mousemove', function (d, e) {
                    d3.select('.app_tooltip')
                        .remove();
                    d3.select('#app_tooltip')
                        .append('div')
                        .style('position', 'fixed')
                        .style('left', `${d.pageX + 20}px`)
                        .style('top', `${d.pageY + 20}px`)
                        .style('padding', '10px')
                        .attr('class', 'app_tooltip')
                        .html(`Total: ${appInfo.W.send + appInfo.W.receive}<br/>Send: ${appInfo.W.send}`);
                })
                .on('mouseout', function (d) {
                    d3.select('.app_tooltip')
                        .remove();
                })
                .transition().duration(DURATION)
                .attr('x', WIDTH / 4 * 3 - WIDTH / 6)
                .attr('y', HEIGHT - marginBottom - yScale(appInfo.W.send))
                .attr('width', WIDTH / 4)
                .attr('height', yScale(appInfo.W.send))
                .attr('fill', (filter_app === null || filter_app === 'W') ? '#84abfc' : 'lightgrey')

            d3.select('#app_WR')
                .on('mousemove', function (d, e) {
                    d3.select('.app_tooltip')
                        .remove();
                    d3.select('#app_tooltip')
                        .append('div')
                        .style('position', 'fixed')
                        .style('left', `${d.pageX + 20}px`)
                        .style('top', `${d.pageY + 20}px`)
                        .style('padding', '10px')
                        .attr('class', 'app_tooltip')
                        .html(`Total: ${appInfo.W.send + appInfo.W.receive}<br/>Receive: ${appInfo.W.receive}`);
                })
                .on('mouseout', function (d) {
                    d3.select('.app_tooltip')
                        .remove();
                })
                .transition().duration(DURATION)
                .attr('x', WIDTH / 4 * 3 - WIDTH / 6)
                .attr('y', HEIGHT - marginBottom - yScale(appInfo.W.receive) - yScale(appInfo.W.send))
                .attr('width', WIDTH / 4)
                .attr('height', yScale(appInfo.W.receive))
                .attr('fill', (filter_app === null || filter_app === 'W') ? '#6dc0c2' : 'lightgrey')
            d3.select('#apps_yAxis')
                .transition().duration(DURATION)
                .call(yAxis);
            d3.select('#app_qq')
                .on('click', () => {
                    filter_setApp('Q')
                });
            d3.select('#app_wechat')
                .on('click', () => {
                    filter_setApp('W')
                })
            d3.select('#apps_background')
                .on('click', () => {
                    filter_setApp(null)
                })
        })
        return (
            <>
                <svg id={'apps'} width={WIDTHRAW} height={HEIGHT}>
                    <rect id={'apps_background'} width={WIDTHRAW} height={HEIGHT} fill={'white'}/>
                    <g id="app_bar" transform={`translate(${10},${5})`}>
                        <g id={'apps_yAxis'} transform={`translate(${WIDTH / 4},0)`} opacity={0.8}/>
                        <g id={'app_qq'}>
                            <rect x="50" y="0" width={HEIGHT / 6} height="0.0"
                                  fill="#6DC0C2" className="app_rect" id={'app_QS'}/>
                            <rect x="50" y="0" width={HEIGHT / 6} height="0.0"
                                  fill="#84ABFC" className="app_rect" id={'app_QR'}/>
                        </g>
                        <g id={'app_wechat'}>
                            <rect x="100" y="0" width={HEIGHT / 6} height="0"
                                  fill="#6DC0C2" className="app_rect" id={'app_WS'}/>
                            <rect x="100" y="0" width="41.666666666666664" height="0.0" fill="#84ABFC"
                                  className="app_rect" id={'app_WR'}/>
                        </g>
                        <text x={WIDTH * (3 / 4 + 1 / 10 - 1 / 6) + 2} y={HEIGHT - marginBottom / 2} fontSize="11"
                              fontWeight="300" textAnchor="middle"
                              className="app_rect">WeChat
                        </text>
                        <text x={WIDTH * (1 / 4 + 1 / 10)} y={HEIGHT - marginBottom / 2} fontSize="11"
                              fontWeight="300" textAnchor="middle"
                              className="app_rect">QQ
                        </text>
                        <g id={'legend'} transform={`translate(${WIDTH - 15},${HEIGHT / 2})`}>
                            <g id={'rev_leg'}>
                                <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#9cbec2'}/>
                                <text fontSize={10} transform={'translate(20,10)'}>Receive</text>
                            </g>
                            <g id={'send_leg'} transform={'translate(0,20)'}>
                                <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#99a6f6'}/>
                                <text fontSize={10} transform={'translate(20,10)'}>Send</text>
                            </g>
                        </g>
                    </g>
                </svg>
                <div id={'app_tooltip'}/>
            </>
        )
    }

    function Friends(props) {
        const {
            filter_friend,
            filter_setFriend,
            filter_dateRange,
            message_tree,
            totalMsgApp,
            filter_group,
            filter_app
        } = props
        const WIDTH = 750;
        const HEIGHT = 500;
        const DURATION = 250;
        const margin = {
            top: 30,
            left: 100,
            right: 50,
            bottom: 0
        }
        let color14 = [
            '#6e9dfb',
            '#b3d8ec',
            '#99d3d4',
            '#a4debf',
            '#86cb79',
            '#bce089',
            '#f3dd73',
            '#daa878',
            '#d9697b',
            '#ca81cf',
            '#8d59e1',
            '#9b88ed',
            '#564dcb',
            '#8c8ee7'
        ];
        let group_names = ['Friends', 'College classmates', 'Other classmates', 'Family', 'Teachers', 'Others']
        let color = {
            'Friends': '#6e9dfc',
            'College classmates': '#83cacb',
            'Other classmates': '#86cb79',
            'Family': '#f1d754',
            'Teachers': '#d9697b',
            'Others': '#a175e6'
        }

        let friendInfo = {};
        let groupInfo = {}
        Object.keys(message_tree).forEach(d => { //date, string format
            if (d !== 'count' && (filter_dateRange === null || filter_dateRange.includes(d))) {
                Object.keys(message_tree[d]).forEach(e => {//app
                    if (e !== 'count' && (filter_app === null || filter_app === e)) {
                        Object.keys(message_tree[d][e]).forEach(f => {//group
                            if (f !== 'count' && (filter_group === null || filter_group === f)) {
                                Object.keys(message_tree[d][e][f]).forEach(g => {//friend
                                    if (g !== 'count') {
                                        if (friendInfo[g] === undefined) {
                                            friendInfo[g] = message_tree[d][e][f][g].count
                                        } else {
                                            friendInfo[g] += message_tree[d][e][f][g].count
                                        }
                                        groupInfo[g] = f
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        function hash(s) {
            let Hash = 0;
            for (let i = 0; i < s.length && i < 8; i++) {
                Hash += s.charCodeAt(i) * (10 ** i);
            }
            return Hash
        }

        let friendArray = []
        Object.keys(friendInfo).forEach(name => {
            friendArray.push([name, friendInfo[name]])
        })
        friendArray.sort((a, b) => {
            return -a[1] + b[1]
        })
        const friendData = friendArray.slice(0, 15).filter(d => {
            return d[0] !== ''
        }).slice(0, 10)
        const friendDataHashList = friendData.map(d => {
            return hash(d[0])
        })
        React.useEffect(() => {
                let xscale = d3.scaleLinear()
                    .range([0, WIDTH - margin.right - margin.left])
                    .domain([0, d3.max(friendData, d => d[1])])
                    .nice()
                let yscale = d3.scaleBand()
                    .range([0, HEIGHT - margin.top - margin.bottom])
                    .domain(friendData.map(d => d[0]))
                let xAxis = d3.axisTop(xscale)
                let xAxisBottom = d3.axisBottom(xscale)
                    .tickSizeInner(HEIGHT - margin.top - margin.bottom)
                    .tickSizeOuter(0)
                    .tickFormat(d3.format(""));
                let svg = d3.select('#friends g')
                    .attr('transform', `translate(0,${margin.top})`)

                function update() {
                    xscale.domain([0, d3.max(friendData, d => d[1])])
                    yscale.domain(friendData.map(d => d[0]))
                    svg.selectAll('.bar')
                        .each(function () {
                            if (!friendDataHashList.includes(hash(d3.select(this).attr('id').slice(4)))) {
                                let group = d3.select(this)//group
                                    .transition().delay(TRANSITION_DELAY)
                                    .remove();
                                group.select('rect')
                                    .transition().delay(TRANSITION_DELAY)
                                    .duration(DURATION * 3)
                                    .attr('width', HEIGHT * 1.3)
                                    .attr('y', 0)
                                    .remove();
                            }
                        })
                    friendData.forEach(d => {
                        let bar = svg.select('#bar_' + hash(d[0]))
                        if (bar.empty()) {
                            let g = svg.append('g')
                                .attr('class', 'bar')
                                .attr('id', 'bar_' + hash(d[0]))
                            g.append('text')
                                .attr('font-size', 12)
                                .attr('class', 'name')
                                .text(d[0])
                                .attr('x', 0)
                                .attr('y', HEIGHT - margin.top - margin.bottom)
                            g.append('text')
                                .attr('font-size', 12)
                                .attr('class', 'count')
                                .text(0)
                                .attr('x', xscale(d[1]) + 10 + margin.left)
                                .attr('y', HEIGHT - margin.top - margin.bottom)
                            g.append('rect')
                                .data(d)
                                .attr('fill', (filter_friend === groupInfo[d[0]] || filter_friend === null) ? color[groupInfo[d[0]]] : 'lightgrey')
                                .attr('height', yscale.bandwidth() * 0.8)
                                .attr('width', xscale(d[1]))
                                .attr('x', margin.left)
                                .attr('y', HEIGHT - margin.top - margin.bottom)


                        }
                        let group = svg.select('#bar_' + hash(d[0]))
                        let rect = group.select('rect')
                        let name = group.select('.name')
                        let count = group.select('.count')
                        group.transition().delay(TRANSITION_DELAY)
                            .duration(DURATION * 3)
                            .attr('width', xscale(d[1]))
                            .attr('y', yscale(d[0]));
                        rect.on('click', (event, data) => {
                            filter_setFriend(data)
                        }).transition().delay(TRANSITION_DELAY)
                            .duration(DURATION * 3)
                            .attr('height', yscale.bandwidth() * 0.8)
                            .attr('width', xscale(d[1]))
                            .attr('y', yscale(d[0]))
                            .attr('fill', d => {
                                return (filter_friend === d || filter_friend === null) ? color[groupInfo[d]] : 'lightgrey'
                            });
                        name.transition().delay(TRANSITION_DELAY)
                            .duration(DURATION * 3)
                            .attr('y', yscale(d[0]) + yscale.bandwidth() * 0.5);
                        count.transition().delay(TRANSITION_DELAY)
                            .duration(DURATION * 3)
                            .tween('text', function () {
                                let i = d3.interpolateNumber(+this.innerHTML, d[1])
                                return function (t) {
                                    this.innerHTML = Math.round(i(t))
                                }
                            })
                            .attr('y', yscale(d[0]) + yscale.bandwidth() * 0.5)
                            .attr('x', xscale(d[1]) + 10 + margin.left);
                    })
                    svg.select('.xaxis')
                        .transition()
                        .duration(DURATION * 3)
                        .call(xAxis);

                    svg.select('.xaxisBottom')
                        .transition()
                        .duration(DURATION * 3)
                        .call(xAxisBottom);
                }

                update()
                d3.select('#friends_bg')
                    .on('click', () => {
                        filter_setFriend(null)
                    })
            }
        )
        return (<>
            <svg id={'friends'} width={WIDTH} height={HEIGHT}>
                <rect id={'friends_bg'} width={WIDTH} height={HEIGHT} fill={'white'}/>
                <g>
                    <g className={'xaxis'} transform={`translate(${margin.left},-10)`}/>
                    <g className={'xaxisBottom'} transform={`translate(${margin.left},-10)`} opacity={0.1}/>
                    <g className={'yaxis'}/>
                </g>
            </svg>
        </>)
    }

    function Action(props) {
        const {
            filter_dateRange, filter_setDateRange,
            filter_group, filter_setGroup,
            filter_app, filter_setApp,
            filter_friend, filter_setFriend,
            message_tree, totalMsgApp,
            friend_list, friend_group_list
        } = props
        //const [subDURATION, SET_subDURATION] = React.useState(200)
        const WIDTH = 750;
        const HEIGHT = 250; //900-38
        const margin = {
            top: 30,
            left: 0,
            right: 100,
            bottom: 30
        }
        const [form] = Form.useForm()
        const [playInterval, setPlayInterval] = React.useState()
        React.useEffect(() => {
            form.setFieldsValue({
                group: filter_group === null ? 'all' : filter_group,
                app: filter_app === null ? 'all' : filter_app,
                friend: filter_friend === null ? 'all' : filter_friend,
            })
        })

        function MyForm(props) {
            return (<>
                <Form form={props.form} layout={'vertical'} onValuesChange={(changedValue) => {
                    let changedKey = Object.keys(changedValue)[0]
                    if (changedKey === 'group') {
                        filter_setGroup(changedValue[changedKey] === 'all' ? null : changedValue[changedKey])
                    }
                    if (changedKey === 'app') {
                        filter_setApp(changedValue[changedKey] === 'all' ? null : changedValue[changedKey])
                    }
                    if (changedKey === 'friend') {
                        filter_setFriend(changedValue[changedKey] === 'all' ? null : changedValue[changedKey])
                    }
                }}>
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name={'group'} label={'Group'}>
                                <Select>
                                    <Select.Option value='all' key='all'>All</Select.Option>
                                    {GROUP_NAMES.map(d => {
                                        return (
                                            <Select.Option value={d} key={d}>{d}</Select.Option>
                                        )
                                    })}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name={'app'} label={'App'}>
                                <Select>
                                    <Select.Option value={'all'}>All</Select.Option>
                                    <Select.Option value={'W'}>WeChat</Select.Option>
                                    <Select.Option value={'Q'}>QQ</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name={'friend'} label={'Friend'}>
                                <Select showSearch>
                                    <Select.Option value='all' key='all'>All</Select.Option>
                                    {
                                        GROUP_NAMES.includes(props.form.getFieldValue('group')) ?
                                            friend_group_list[props.form.getFieldValue('group')].map(d => {
                                                    return (<Select.Option value={d} key={d}>{d}</Select.Option>)
                                                }
                                            )
                                            :
                                            friend_list.map(d => {
                                                    return (<Select.Option value={d} key={d}>{d}</Select.Option>)
                                                }
                                            )
                                    }
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={'duration'} label={'Duration'} initialValue={'28'}>
                                <Select>
                                    <Select.Option value='7'>7 days</Select.Option>
                                    <Select.Option value='14'>14 days</Select.Option>
                                    <Select.Option value='28'>28 days</Select.Option>
                                    <Select.Option value='56'>56 days</Select.Option>
                                    <Select.Option value='112'>112 days</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={'step'} label={'Step'} initialValue={'1'}>
                                <Select>
                                    <Select.Option value={'1'}>1 day</Select.Option>
                                    <Select.Option value={'2'}>2 days</Select.Option>
                                    <Select.Option value={'3'}>3 days</Select.Option>
                                    <Select.Option value={'4'}>4 days</Select.Option>
                                    <Select.Option value={'5'}>5 days</Select.Option>
                                    <Select.Option value={'6'}>6 days</Select.Option>
                                    <Select.Option value={'7'}>7 days</Select.Option>
                                    <Select.Option value={'14'}>14 days</Select.Option>
                                    <Select.Option value={'28'}>28 days</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </>)
        }

        return (<>
            <Row>
                <Col span={10}>
                    <MyForm form={form}/>
                </Col>
                <Col span={14}>
                    <Row>
                        <Col span={24} style={{
                            display: 'flex', justifyContent: "space-around", alignItems: 'center',
                            padding: '50px 100px 0 100px'
                        }}>
                            <Button type="primary" shape="circle" size='large' icon={<CaretRightOutlined/>}
                                    onClick={() => {
                                        clearInterval(playInterval)
                                        let minDateObj = moment(minDate.toDate())
                                        let date_range = d3.timeDay
                                            .range(
                                                minDate.toDate(),
                                                minDateObj.add(+form.getFieldValue('duration'), 'd').toDate()
                                            )
                                        date_range = date_range.map(d => {
                                            return moment(d).format('YYYY-MM-DD')
                                        })
                                        filter_setDateRange(date_range)

                                        setPlayInterval(
                                            setInterval(() => {
                                                date_range = date_range.map(d => {
                                                    return moment(d, 'YYYY-MM-DD').add(+form.getFieldValue('step'), 'd').format('YYYY-MM-DD')
                                                })
                                                filter_setDateRange(date_range)
                                                if (moment(date_range[date_range.length - 1],'YYYY-MM-DD').isAfter(maxDate)) {
                                                    clearInterval(playInterval)
                                                    //todo: this doesnt seem to work
                                                }
                                            }, 3 * DURATION)
                                        )
                                    }}/>
                            <Button shape="circle" size='large' icon={<PauseOutlined/>} onClick={() => {
                                clearInterval(playInterval)
                            }}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{
                            display: 'flex', justifyContent: "center", alignItems: 'center',
                            paddingTop: '50px '
                        }}>
                            <Button type="link" onClick={() => {
                                d3.select('#heatmap').call(d3.brush().move, null);
                                d3.select('#area_mask').remove();
                                filter_setApp(null);
                                filter_setGroup(null);
                                filter_setFriend(null);
                                filter_setDateRange(null);
                                form.setFieldsValue({duration: '56', step: '28'})
                            }}>Clear Selection</Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>)
    }

    function ActiveTime(props) {
        const {
            filter_dateRange,
            filter_group,
            filter_app,
            filter_friend,
            message_tree,
            totalMsgApp
        } = props
        const WIDTH = 750;
        const HEIGHT = 500; //900-38
        const margin = {
            top: 30,
            left: 40,
            right: 100,
            bottom: 30
        }
        const LEGENDWIDTH = 10;

        let hoursInfoSend = d3.range(48).map(d => {
            return 0
        })
        let hoursInfoRev = d3.range(48).map(d => {
            return 0
        })
        let weekInfoSend = d3.range(7).map(d => {
            return 0
        })
        let weekInfoRev = d3.range(7).map(d => {
            return 0
        })
        Object.keys(message_tree).forEach(d => { //date, string format
            if (d !== 'count' && (filter_dateRange === null || filter_dateRange.includes(d))) {
                Object.keys(message_tree[d]).forEach(e => {//app
                    if (e !== 'count' && (filter_app === null || filter_app === e)) {
                        Object.keys(message_tree[d][e]).forEach(f => {//group
                            if (f !== 'count' && (filter_group === null || filter_group === f)) {
                                Object.keys(message_tree[d][e][f]).forEach(g => {//friend
                                    if (g !== 'count' && (filter_friend === null || filter_friend === g)) {
                                        Object.keys(message_tree[d][e][f][g]).forEach(h => {//time
                                            if (h !== 'count') {
                                                const send = message_tree[d][e][f][g][h].send === undefined ? 0 : message_tree[d][e][f][g][h].send.count
                                                const rev = message_tree[d][e][f][g][h].receive === undefined ? 0 : message_tree[d][e][f][g][h].receive.count
                                                hoursInfoSend[h] += send
                                                hoursInfoRev[h] += rev
                                                weekInfoSend[(+(moment(d, 'YYYY-MM-DD').format('e')) + 6 ) % 7] += send
                                                weekInfoRev[(+(moment(d, 'YYYY-MM-DD').format('e'))  + 6 ) % 7] += rev
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

        let hoursInfo = d3.cross(hoursInfoRev, hoursInfoSend, (a, b) => a + b)
        let weekInfo = d3.cross(weekInfoSend, weekInfoRev, (a, b) => a + b)
        let xValueDay = d3.timeMinute.every(30).range(new Date(2000, 0, 1), new Date(2000, 0, 2))
            .map(d => {
                return moment(d).format('HH:mm')
            })

        React.useEffect(() => {
            let xScaleDay = d3.scaleBand()
                .domain(xValueDay)
                .range([0, WIDTH - margin.left - margin.right])
                .padding(0.3)
            let xaxisDay = d3.axisBottom(xScaleDay)
                .tickValues(xScaleDay.domain().filter(function (d, i) {
                    return !(i % 6)
                }))
            let yScaleDay = d3.scaleLinear()
                .domain([d3.max(hoursInfo), 0])
                .range([HEIGHT / 2 - margin.top - margin.left, 0])
                .nice()
            let yaxisDay = d3.axisLeft(
                d3.scaleLinear()
                    .domain([0, d3.max(hoursInfo)])
                    .range([HEIGHT / 2 - margin.top - margin.left, 0])
                    .nice()
            ).ticks(5)
            let xScaleWeek = d3.scaleBand()
                .domain(weeks)
                .range([0, WIDTH - margin.left - margin.right])
                .padding(0.6)
            let xaxisWeek = d3.axisBottom(xScaleWeek)
            let yScaleWeek = d3.scaleLinear()
                .domain([d3.max(weekInfo), 0])
                .domain([d3.max(weekInfo), 0])
                .range([HEIGHT / 2 - margin.top - margin.left, 0])
                .nice()
            let yaxisWeek = d3.axisLeft(
                d3.scaleLinear()
                    .domain([0, d3.max(weekInfo)])
                    .range([HEIGHT / 2 - margin.top - margin.left, 0])
                    .nice()
            ).ticks(5)
            let svgDaySend = d3.select('#g_day #send')
            let svgDayRev = d3.select('#g_day #rev')
            let svgWeekSend = d3.select('#g_week #send')
            let svgWeekRev = d3.select('#g_week #rev')

            svgDaySend.selectAll('rect')
                .data(hoursInfoSend)
                .enter()
                .append('rect')
                .attr('x', (d, i) => {
                    return xScaleDay(xValueDay[i])
                })
                .attr('y', (d) => {
                    return HEIGHT / 2 - yScaleDay(d) - margin.bottom
                })
                .attr('width', xScaleDay.bandwidth())
                .attr('height', (d) => {
                    return yScaleDay(d)
                })
                .attr('fill', '#91a8f9')
            svgDaySend.selectAll('rect')
                .transition().duration(DURATION)
                .attr('x', (d, i) => {
                    return xScaleDay(xValueDay[i])
                })
                .attr('y', (d) => {
                    return HEIGHT / 2 - yScaleDay(d) - margin.bottom
                })
                .attr('width', xScaleDay.bandwidth())
                .attr('height', (d) => {
                    return yScaleDay(d)
                });
            svgDayRev.selectAll('rect')
                .data(hoursInfoRev)
                .enter()
                .append('rect')
                .attr('x', (d, i) => {
                    return xScaleDay(xValueDay[i])
                })
                .attr('y', (d, i) => {
                    return HEIGHT / 2 - yScaleDay(d) - margin.bottom - yScaleDay(hoursInfoSend[i])
                })
                .attr('width', xScaleDay.bandwidth())
                .attr('height', (d) => {
                    return yScaleDay(d)
                })
                .attr('fill', '#8bbfc2')
            svgDayRev.selectAll('rect')
                .transition().duration(DURATION)
                .attr('x', (d, i) => {
                    return xScaleDay(xValueDay[i])
                })
                .attr('y', (d, i) => {
                    return HEIGHT / 2 - yScaleDay(d) - margin.bottom - yScaleDay(hoursInfoSend[i])
                })
                .attr('width', xScaleDay.bandwidth())
                .attr('height', (d) => {
                    return yScaleDay(d)
                });

            svgWeekSend.selectAll('rect')
                .data(weekInfoSend)
                .enter()
                .append('rect')
                .attr('x', (d, i) => {
                    return xScaleWeek(weeks[i])
                })
                .attr('y', (d) => {
                    return HEIGHT / 2 - yScaleWeek(d) - margin.bottom
                })
                .attr('width', xScaleWeek.bandwidth())
                .attr('height', (d) => {
                    return yScaleWeek(d)
                })
                .attr('fill', '#91a8f9')
            svgWeekSend.selectAll('rect')
                .transition().duration(DURATION)
                .attr('x', (d, i) => {
                    return xScaleWeek(weeks[i])
                })
                .attr('y', (d) => {
                    return HEIGHT / 2 - yScaleWeek(d) - margin.bottom
                })
                .attr('width', xScaleWeek.bandwidth())
                .attr('height', (d) => {
                    return yScaleWeek(d)
                });
            svgWeekRev.selectAll('rect')
                .data(weekInfoRev)
                .enter()
                .append('rect')
                .attr('x', (d, i) => {
                    return xScaleWeek(weeks[i])
                })
                .attr('y', (d, i) => {
                    return HEIGHT / 2 - yScaleWeek(d) - margin.bottom - yScaleWeek(weekInfoSend[i])
                })
                .attr('width', xScaleWeek.bandwidth())
                .attr('height', (d) => {
                    return yScaleWeek(d)
                })
                .attr('fill', '#8bbfc2')
            svgWeekRev.selectAll('rect')
                .transition().duration(DURATION)
                .attr('x', (d, i) => {
                    return xScaleWeek(weeks[i])
                })
                .attr('y', (d, i) => {
                    return HEIGHT / 2 - yScaleWeek(d) - margin.bottom - yScaleWeek(weekInfoSend[i])
                })
                .attr('width', xScaleWeek.bandwidth())
                .attr('height', (d) => {
                    return yScaleWeek(d)
                });

            d3.select('#g_day #xaxis')
                .call(xaxisDay)
            d3.select('#g_week #xaxis')
                .call(xaxisWeek)
            d3.select('#g_day #yaxis')
                .transition()
                .duration(DURATION)
                .call(yaxisDay);
            d3.select('#g_week #yaxis')
                .transition()
                .duration(DURATION)
                .call(yaxisWeek);
        })

        return (<>
            <svg width={WIDTH} height={HEIGHT}>
                <g id={'g_day'} transform={`translate(${margin.left},${0})`}>
                    <text transform={`translate(${-margin.left},${15})`} fontSize={13}>By day</text>
                    <g id={'send'}/>
                    <g id={'rev'}/>
                    <g id={'xaxis'} transform={`translate(0,${HEIGHT / 2 - margin.bottom})`}/>
                    <g id={'yaxis'} transform={`translate(0,${margin.top * 1.3})`}/>
                    <g id={'legend'} transform={`translate(${WIDTH - margin.right - margin.left + 10},${HEIGHT / 4})`}>
                        <g id={'send_leg'}>
                            <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#9cbec2'}/>
                            <text fontSize={10} transform={'translate(20,10)'}>Receive</text>
                        </g>
                        <g id={'send_leg'} transform={'translate(0,20)'}>
                            <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#99a6f6'}/>
                            <text fontSize={10} transform={'translate(20,10)'}>Send</text>
                        </g>
                    </g>
                </g>
                <g id={'g_week'} transform={`translate(${margin.left},${HEIGHT / 2})`}>
                    <text transform={`translate(${-margin.left},${15})`} fontSize={13}>By week</text>
                    <g id={'send'}/>
                    <g id={'rev'}/>
                    <g id={'xaxis'} transform={`translate(0,${HEIGHT / 2 - margin.bottom})`}/>
                    <g id={'yaxis'} transform={`translate(0,${margin.top * 1.3})`}/>
                    <g id={'legend'} transform={`translate(${WIDTH - margin.right - margin.left + 10},${HEIGHT / 4})`}>
                        <g id={'send_leg'}>
                            <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#9cbec2'}/>
                            <text fontSize={10} transform={'translate(20,10)'}>Receive</text>
                        </g>
                        <g id={'send_leg'} transform={'translate(0,20)'}>
                            <rect width={LEGENDWIDTH} height={LEGENDWIDTH} fill={'#99a6f6'}/>
                            <text fontSize={10} transform={'translate(20,10)'}>Send</text>
                        </g>
                    </g>
                </g>
            </svg>
        </>)
    }

    const dataAll = useData(process.env.PUBLIC_URL + 'data.csv');

    if (!dataAll) {
        return <Loading/>;
    }
    ;
    const minDate = moment('2019-06-07', 'YYYY-MM-DD')
    const maxDate = moment.max(dataAll.map(d => d.time));
    const rangeByDate = d3_time.timeDay.range(minDate.toDate(), maxDate.toDate(), 1) //js.Date() Object
    const rangeByWeek = d3_time.timeMonday.range(minDate.toDate(), maxDate.toDate(), 1)
    const rangeByMonth = d3_time.timeMonth.range(minDate.toDate(), maxDate.toDate(), 1)
    const rangeByYear = d3_time.timeYear.range(minDate.toDate(), maxDate.toDate(), 1)
    const weeks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    let conversations = {}
    rangeByDate.forEach(d => {
        conversations[moment(d).format('YYYY-MM-DD')] = 0
    })
    dataAll.forEach(d => {
        if (d.time.isBetween(minDate, maxDate)) {
            conversations[moment(d.time).format('YYYY-MM-DD')] += 1
        }
    })
    let conversationData = [];
    Object.keys(conversations).forEach((d) => conversationData.push({
        date: d,
        msg: conversations[d]
    }))

    let friend_list = []
    let friend_group_list = {}
    const message_tree = {}
    dataAll.forEach(d => {
        //date
        if (message_tree[d.time.format('YYYY-MM-DD')] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')] = {count: 1}
        } else {
            message_tree[d.time.format('YYYY-MM-DD')].count += 1
        }
        //app
        if (message_tree[d.time.format('YYYY-MM-DD')][d.app] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')][d.app] = {count: 1}
        } else {
            message_tree[d.time.format('YYYY-MM-DD')][d.app].count += 1
        }
        if (message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group] = {count: 1}
            if (friend_group_list[d.group] === undefined) {
                friend_group_list[d.group] = []
            }
        } else {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group].count += 1
        }
        if (message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker] = {count: 1}
            if (!friend_list.includes(d.talker)) {
                friend_list.push(d.talker)
                friend_group_list[d.group].push(d.talker)
            }
        } else {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker].count += 1
        }
        if (message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)] = {count: 1}
        } else {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)].count += 1
        }
        if (message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)][d.is_send ? 'send' : 'receive'] === undefined) {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)][d.is_send ? 'send' : 'receive'] = {count: 1}
        } else {
            message_tree[d.time.format('YYYY-MM-DD')][d.app][d.group][d.talker][d.time.hour() * 2 + (d.time.minute() < 30)][d.is_send ? 'send' : 'receive'].count += 1
        }
    })
    let totalMsgApp = {Q: 0, W: 0}
    Object.keys(message_tree).forEach(d => { //date, string format
        if (d !== 'count') {
            Object.keys(message_tree[d]).forEach(e => {//app
                if (e !== 'count') {
                    totalMsgApp[e] += message_tree[d][e].count
                }
            })
        }
    })

    function Main() {
        const [filter_dateRange, filter_setDateRange] = React.useState(null);
        const [filter_group, filter_setGroup] = React.useState(null);
        const [filter_app, filter_setApp] = React.useState(null);
        const [filter_friend, filter_setFriend] = React.useState(null);
        return (
            <Layout>
                <Header className={'header'}>
                    <img src={process.env.PUBLIC_URL + 'chatting_life_logo.png'} className={'logo'} alt={'logo'}/>
                </Header>
                <Content className={'content'} style={{width: CONTENT_WIDTH + 'px'}}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Card bordered={false}>
                                <p>Total Message</p>
                                <TotalMessage
                                    rangeByWeek={rangeByWeek} rangeByMonth={rangeByMonth}
                                    rangeByYear={rangeByYear} weeks={weeks} conversations={conversations}
                                    filter_dateRange={filter_dateRange} filter_setDateRange={filter_setDateRange}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Row gutter={[16, 16]}>
                                <Col span={16}>
                                    <Card bordered={false}>
                                        <p>Groups</p>
                                        <Group filter_group={filter_group} filter_setGroup={filter_setGroup}
                                               message_tree={message_tree} filter_dateRange={filter_dateRange}
                                               filter_app={filter_app}/>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card bordered={false}>
                                        <p>Apps</p>
                                        <Apps filter_app={filter_app} filter_setApp={filter_setApp}
                                              filter_dateRange={filter_dateRange} filter_group={filter_group}
                                              message_tree={message_tree} totalMsgApp={totalMsgApp} filter_friend={filter_friend}/>
                                    </Card>
                                </Col>
                            </Row>
                            <br/>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Card bordered={false}>
                                        <p>Top Friends</p>
                                        <Friends filter_friend={filter_friend} filter_setFriend={filter_setFriend}
                                                 filter_dateRange={filter_dateRange} filter_group={filter_group}
                                                 message_tree={message_tree} totalMsgApp={totalMsgApp}
                                                 filter_app={filter_app}/>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={12}>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Card bordered={false}>
                                        <p>Action Center</p>
                                        <Action filter_dateRange={filter_dateRange}
                                                filter_setDateRange={filter_setDateRange}
                                                filter_group={filter_group} filter_setGroup={filter_setGroup}
                                                filter_app={filter_app} filter_setApp={filter_setApp}
                                                filter_friend={filter_friend} filter_setFriend={filter_setFriend}
                                                message_tree={message_tree} totalMsgApp={totalMsgApp}
                                                friend_list={friend_list} friend_group_list={friend_group_list}/>
                                    </Card>
                                </Col>
                            </Row>
                            <br/>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Card bordered={false}>
                                        <p>Active Time</p>
                                        <ActiveTime filter_dateRange={filter_dateRange} filter_group={filter_group}
                                                    filter_app={filter_app} filter_friend={filter_friend}
                                                    message_tree={message_tree} totalMsgApp={totalMsgApp}/>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Content>
                <Footer>
                    <div className={'footer'}>
                        @Harry Lee | DATS-SHU 235 Information Visualization Course Project
                    </div>
                </Footer>
            </Layout>
        );
    }

    return (
        <Main/>
    )
}

export default App;