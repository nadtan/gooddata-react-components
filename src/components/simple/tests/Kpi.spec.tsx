// (C) 2007-2018 GoodData Corporation
import * as React from 'react';
import { mount } from 'enzyme';
import { set } from 'lodash';

import {
    LoadingComponent,
    ErrorComponent
} from '../../tests/mocks';
import { Kpi, IKpiProps } from '../Kpi';
import { delay } from '../../tests/utils';
import { ErrorStates } from '../../../constants/errorStates';
import { emptyResponse, oneMeasureOneDimensionResponse } from '../../../execution/fixtures/ExecuteAfm.fixtures';

class DummyExecute extends React.Component<any, null> {
    public render() {
        return this.props.children({ result: oneMeasureOneDimensionResponse });
    }
}

class DummyExecuteEmpty extends React.Component<any, null> {
    public render() {
        return this.props.children({ result: emptyResponse });
    }
}

class DummyExecuteLoading extends React.Component<any, null> {
    public render() {
        return this.props.children({ result: null, isLoading: true, error: null });
    }
}

class DummyExecuteError extends React.Component<any, null> {
    public render() {
        return this.props.children({ result: null, isLoading: true, error: { status: ErrorStates.BAD_REQUEST } });
    }
}

describe('Kpi', () => {
    function createComponent({ ExecuteComponent = DummyExecute, ...otherProps }: any = {}) {
        const props: IKpiProps = {
            ...otherProps,
            projectId: 'myprojectid',
            measure: '/gdc/md/myprojectid/obj/123',
            ExecuteComponent
        };

        return mount(<Kpi {...props} />);
    }

    it('should use default format from execution', () => {
        const wrapper = createComponent();
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('$42,470,571.16');
        });
    });

    it('should use default format specified in component if there is none in execution', () => {
        class ExecuteComp extends React.Component<any, null> {
            public render() {
                const result = oneMeasureOneDimensionResponse;
                set(
                    result,
                    'executionResponse.dimensions.0.headers.0.measureGroupHeader.items.0.measureHeaderItem.format', null
                );

                return this.props.children({ result });
            }
        }
        const wrapper = createComponent({ ExecuteComponent: ExecuteComp });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('42,470,571.16');
        });
    });

    it('should use format #,#', () => {
        const wrapper = createComponent({ format: '#,#' });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('42,470,571');
        });
    });

    it('should use format with conditions', () => {
        const wrapper = createComponent({ format: '[>=1000000]#,,.0 M;[>=1000]#,.0 K;[>=0]#,##0' });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('42.5 M');
        });
    });

    it('should use format with colors', () => {
        const wrapper = createComponent({
            format: '[<600000][red]$#,#.##;[=600000][yellow]$#,#.##;[>600000][green]$#,#.##'
        });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').html())
                .toEqual('<span class="gdc-kpi"><span style="color: rgb(0, 170, 0);">$42,470,571.16</span></span>');
        });
    });

    it('should use format with M', () => {
        const wrapper = createComponent({ format: '#,,.0 M' });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('42.5 M');
        });
    });

    it('should use format with backgroundColor', () => {
        const wrapper = createComponent({ format: '[backgroundcolor=CCCCCC][red]$#,#.##' });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').html())
                .toEqual('<span class="gdc-kpi"><span style="color: rgb(255, 0, 0); background-color: rgb(204, 204, 204);">$42,470,571.16</span></span>'); // tslint:disable-line:max-line-length
        });
    });

    it('should use format with dollar sign', () => {
        const wrapper = createComponent({ format: '$#,#.##' });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').text()).toEqual('$42,470,571.16');
        });
    });

    it('should render null value', () => {
        const wrapper = createComponent({
            format: '[=Null][backgroundcolor=DDDDDD][red]No Value;',
            ExecuteComponent: DummyExecuteEmpty
        });
        return delay().then(() => {
            expect(wrapper.find('.gdc-kpi').html())
                .toEqual('<span class="gdc-kpi"><span style="color: rgb(255, 0, 0); background-color: rgb(221, 221, 221);">No Value</span></span>'); // tslint:disable-line:max-line-length
        });
    });

    it('should pass telemetryComponentName prop to the Execute component', () => {
        const wrapper = createComponent({
            ExecuteComponent: (props: any) => {
                return props.children({ result: emptyResponse });
            }
        });
        return delay().then(() => {
            expect(wrapper.find('ExecuteComponent').prop('telemetryComponentName'))
                .toEqual('KPI');
        });
    });

    it('should render LoadingComponent during loading', () => {
        const wrapper = createComponent({
            LoadingComponent,
            ExecuteComponent: DummyExecuteLoading
        });

        return delay().then(() => {
            expect(wrapper.find(LoadingComponent).length).toBe(1);
        });
    });

    it('should render ErrorComponent during loading', () => {
        const wrapper = createComponent({
            ErrorComponent,
            ExecuteComponent: DummyExecuteError
        });

        return delay().then(() => {
            expect(wrapper.find(ErrorComponent).length).toBe(1);
        });
    });
});
