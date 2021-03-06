/**
 * HoServer Manager Ver 1.0
 * Copyright http://hos.helloreact.cn
 *
 * create: 2020/01/20
 * author: Jack Zhang
 * */
import '@ant-design/compatible/assets/index.css'

import {Form as LegacyForm, Icon} from "@ant-design/compatible";
import {DownOutlined, PlusOutlined} from '@ant-design/icons'
import {Badge, Button, Divider, Dropdown, Input, InputNumber, Menu, message, Modal, Switch} from 'antd'
import _ from 'lodash'
import React, {useEffect, useRef, useState} from 'react'

import BadgeButton from "@/components/BadgeButton"
import ProTable from '@/components/ProTable'
import Constants from "@/utils/constants"
import {setDefaultColumn} from "@/utils/utils"

const defTableColumns = setDefaultColumn([
    {
        title: '键名',
        dataIndex: 'key',
        sorter: true,
        searchFlag: 1
    },
    {
        title: '取值',
        dataIndex: 'value',
        sorter: true,
        searchFlag: 1
    },
    {
        title: '备注',
        dataIndex: 'description'
    },
    {
        title: '排序',
        dataIndex: 'order',
        sorter: true,
        width: 50,
        valueType: 'number'
    },
    {
        title: '是否启用',
        dataIndex: 'enabled',
        width: 50,
        filters: [
            {text: '是', value: 1},
            {text: '否', value: 0}
        ],
        render: text => {
            return text / 1 === 1 ? '是' : '否'
        }
    }
])

const ValuesList = props => {
    const {editMode, onOk, dictInstance} = props

    const [visible, setVisible] = useState(false)
    const [valueModalVisible, setValueModalVisible] = useState(false)
    const [valueEditMode, setValueEditMode] = useState(1)
    const [selectedRowData, setSelectedRowData] = useState(null)
    const [windowSize, setWindowSize] = useState({width: Constants.MODEL_TABLE_WIDTH, height: 600})

    const actionRef = useRef(null)
    const valuesRef = useRef([])

    useEffect(() => {
        if (visible) {
            valuesRef.current = _.concat([], dictInstance.values || [])
        }
    }, [visible])

    const loadData = params => {
        let data

        const isDesc = params.sort && params.sort.indexOf('-') === 0
        if (isDesc) {
            params.sort = params.sort.substr(1)
            data = _.orderBy(valuesRef.current, params.sort || 'order', ['desc'])
        } else {
            data = _.orderBy(valuesRef.current, params.sort || 'order')
        }

        if (params && params.enabled) {
            data = data.filter(row => {
                const enabled = row.enabled === 0 ? '0' : '1'
                return params.enabled.indexOf(enabled) > -1
            })
        }

        return {
            success: true,
            data,
            pagination: false
        }
    }

    const tableColumns = _.concat([], defTableColumns)
    if (props.editMode) {
        tableColumns.push({
            title: '操作',
            dataIndex: 'enabled',
            valueType: 'operation',
            align: 'center',
            fixed: 'right',
            width: 100,
            render: (text, record) => (
                <>
                    <>
                        <a title="编辑" onClick={async () => {
                            await setValueEditMode(2)
                            await setSelectedRowData(record)
                            await setValueModalVisible(true)
                            props.form.setFieldsValue(record)
                        }}>
                            <Icon type="edit" />
                        </a>
                        <Divider type="vertical" />
                        <a title="删除" onClick={() => {
                            handleRemove(record)
                        }}>
                            <Icon type="delete" />
                        </a>
                    </>
                </>
            ),
        })
    }

    const handleSubmitValue = () => {
        props.form.validateFields(async (err, value) => {
            if (err) return

            const values = valuesRef.current
            const existRecord = values.find(v => v.key === value.key)
            if (valueEditMode === 1) {
                if (existRecord) {
                    return message.error(`键名 ${value.key} 已存在`)
                }

                values.push(value)
            } else {
                if (existRecord && existRecord.key !== selectedRowData.key) {
                    return message.error(`键名 ${value.key} 已存在`)
                }

                const existIndex = values.findIndex(v => v.key === selectedRowData.key)
                if (existIndex > -1) {
                    values[existIndex] = value
                }
            }

            setValueModalVisible(false)
            actionRef.current.reload()
        })
    }

    const handleBatchRemove = records => {
        Modal.confirm({
            content: `确认删除所选记录？`,
            onOk: () => {
                const values = valuesRef.current
                for (let i=0; i<records.length; i++)
                {
                    const record = records[i]
                    const existIndex = values.findIndex(v => v.key === record.key)
                    if (existIndex > -1) {
                        values.splice(existIndex, 1)
                    }
                }
                actionRef.current.reload()
            }
        })
    }

    const handleRemove = record => {
        Modal.confirm({
            content: `确认删除 "${record.value}"？`,
            onOk: () => {
                const values = valuesRef.current
                const existIndex = values.findIndex(v => v.key === record.key)
                if (existIndex > -1) {
                    values.splice(existIndex, 1)
                    actionRef.current.reload()
                }
            }
        })
    }

    const {getFieldDecorator} = props.form

    const values = valuesRef.current
    const count = visible && valuesRef.current ? valuesRef.current.length : _.get(dictInstance, 'values', []).length

    return (
        <>
            <BadgeButton count={count}
                editMode={editMode}
                onClick={() => setVisible(true)}
            />
            {visible ? (
                <Modal
                    key="valuesModal"
                    centered
                    visible
                    destroyOnClose
                    width={windowSize.width}
                    bodyStyle={{ padding: 0, height: windowSize.height, overflow: 'scroll', backgroundColor: '#fff' }}
                    title="字典值列表"
                    footer={!editMode ? <Button type="primary" onClick={() => setVisible(false)}>关闭</Button> : undefined}
                    onOk={() => {
                        onOk && onOk(valuesRef.current)
                        setVisible(false)
                    }}
                    onCancel={() => setVisible(false)}
                >
                    <ProTable
                        actionRef={actionRef}
                        rowKey={r => `${r.key}${r.order}`}
                        options={{search: false}}
                        onFullScreen={() => {
                            if (windowSize.width === Constants.MODEL_TABLE_WIDTH) {
                                setWindowSize({width: window.innerWidth, height: window.innerHeight-110})
                            } else {
                                setWindowSize({width: Constants.MODEL_TABLE_WIDTH, height: 600})
                            }
                        }}
                        toolBarRender={({ selectedRows }) => {
                            if (!editMode) {
                                return []
                            }

                            const selCount = selectedRows ? selectedRows.length : 0
                            return [
                                selCount > 0 ? (
                                    <Dropdown
                                        key="batchMenu"
                                        overlay={
                                            <Menu onClick={e => {
                                                if (e.key === 'remove') {
                                                    handleBatchRemove(selectedRows)
                                                }
                                            }}
                                            >
                                                <Menu.Item key="remove">删除</Menu.Item>
                                            </Menu>
                                        }>
                                        <Button>
                                            <Badge offset={[-6, -4]} count={selCount} />
                                            <span>批量操作</span><DownOutlined />
                                        </Button>
                                    </Dropdown>
                                ) : null,
                                <Button key="resort" onClick={() => {
                                    const newValues = _.orderBy(valuesRef.current, 'order')
                                    let index = 5
                                    for (let i=0; i<newValues.length; i++) {
                                        newValues[i].order = index
                                        index += 5
                                    }

                                    valuesRef.current = newValues
                                    actionRef.current.reload()
                                }}>重编序号</Button>,
                                <Button key="new" icon={<PlusOutlined />} type="primary" onClick={async () => {
                                    await setValueEditMode(1)
                                    await setValueModalVisible(true)
                                    let maxOrder = _.reduce(values, (max, r) => Math.max(max, r.order || 0), 0)
                                    if (!maxOrder) maxOrder = 0

                                    props.form.setFieldsValue({order: maxOrder + 5})
                                }}>
                                    新建
                                </Button>
                            ]
                        }}
                        tableAlertRender={selectedRowKeys => (
                            <div>
                                已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
                            </div>
                        )}
                        request={params => loadData(params)}
                        columns={tableColumns}
                        rowSelection={editMode ? {} : null}
                    />
                    {valueModalVisible ? (
                        <Modal
                            key="dictValueEditModal"
                            centered
                            destroyOnClose
                            width={800}
                            bodyStyle={{ maxHeight: 600, overflow: 'scroll', backgroundColor: '#fff' }}
                            title={`${valueEditMode === 1 ? '新建' : '编辑'}字典键值`}
                            visible
                            footer={!valueEditMode ? <Button type="primary" onClick={() => setValueModalVisible(false)}>关闭</Button> : undefined}
                            onOk={() => handleSubmitValue()}
                            onCancel={() => setValueModalVisible(false)}
                        >
                            <LegacyForm {...Constants.DEF_FORM_ITEM_LAYOUT} layout="horizontal">
                                <LegacyForm.Item required label="键">
                                    {getFieldDecorator('key', {
                                        rules: [
                                            {required: true, message: '键名必填'},
                                            {pattern: '^([A-Za-z0-9/\\\\_\\-]){1,}$', message: '只允许英文字母、数字、下划线和斜线'}
                                        ]
                                    })(<Input placeholder="请输入英文字母数字和下划线" />)}
                                </LegacyForm.Item>
                                <LegacyForm.Item required label="值">
                                    {getFieldDecorator('value', {
                                        rules: [{required: true, message: '键值必填'}]
                                    })(<Input placeholder="请输入" />)}
                                </LegacyForm.Item>
                                <LegacyForm.Item label="备注">
                                    {getFieldDecorator('description')(<Input.TextArea placeholder="请输入" />)}
                                </LegacyForm.Item>
                                <LegacyForm.Item label="排序">
                                    {getFieldDecorator('order')(<InputNumber min={0} />)}
                                </LegacyForm.Item>
                                <LegacyForm.Item label="是否启用">
                                    {getFieldDecorator('enabled', {
                                        initialValue: _.get(selectedRowData, 'enabled', true),
                                        valuePropName: 'checked'
                                    })(<Switch />)}
                                </LegacyForm.Item>
                            </LegacyForm>
                        </Modal>
                    ) : null}
                </Modal>
            ) : null}
        </>
    )
}

export default LegacyForm.create()(ValuesList)
