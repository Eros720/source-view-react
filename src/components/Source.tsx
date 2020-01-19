import {useMemo, FC, ReactNode, CSSProperties, SyntheticEvent} from 'react';
import {LineOfSyntax, SyntaxElement} from 'source-tokenizer';
import {RenderSyntaxTree, EventAttributes} from '../interface';

interface SourceProps {
    className?: string;
    style?: CSSProperties;
    source?: string;
    syntax?: LineOfSyntax[];
    renderSyntaxTree?: RenderSyntaxTree;
    lineStart?: number;
    widgets?: {[key: number]: ReactNode};
    gutterEvents?: EventAttributes;
    codeEvents?: EventAttributes;
}

const mapEventsWith = (events?: EventAttributes) => (line: number): EventAttributes => {
    if (!events) {
        return {};
    }

    const entries = Object.entries(events);
    return entries.reduce(
        (events, [name, fn]) => {
            events[name] = (e: SyntheticEvent) => fn(line, e);
            return events;
        },
        {} as EventAttributes
    );
};

const renderGenericElement = (element: SyntaxElement, i: number): ReactNode => {
    if (typeof element === 'string') {
        return element;
    }

    return (
        <span key={i} className={element.properties?.className?.join(' ')}>
            {element.children.map(renderGenericElement)}
        </span>
    );
};

const renderSyntaxContent = (syntax: LineOfSyntax, {renderSyntaxTree}: SourceProps): ReactNode => {
    const render = (element: SyntaxElement, i: number) => {
        if (typeof element === 'string') {
            return element;
        }

        if (renderSyntaxTree) {
            return renderSyntaxTree(element, renderGenericElement, i);
        }

        return renderGenericElement(element, i);
    };

    return syntax.map(render);
};

const renderLineWith = (props: SourceProps) => {
    const {lineStart = 1, widgets = {}, gutterEvents, codeEvents} = props;
    const mapGutterEvents = mapEventsWith(gutterEvents);
    const mapCodeEvents = mapEventsWith(codeEvents);

    return (children: ReactNode[], current: string | LineOfSyntax, i: number): ReactNode[] => {
        const lineNumber = i + lineStart;

        const lineElement = (
            <tr key={`line-${lineNumber}`} className="source-line">
                <td className="source-gutter" data-line-number={lineNumber} {...mapGutterEvents(lineNumber)} />
                <td className="source-code" {...mapCodeEvents(lineNumber)}>
                    {typeof current === 'string' ? current : renderSyntaxContent(current, props)}
                </td>
            </tr>
        );
        children.push(lineElement);

        const widget = widgets[lineNumber];
        if (widget) {
            const widgetContainerElement = (
                <tr key={`widget-${lineNumber}`} className="source-widget">
                    <td colSpan={2}>
                        {widget}
                    </td>
                </tr>
            );
            children.push(widgetContainerElement);
        }

        return children;
    };
};

export const Source: FC<SourceProps> = props => {
    const {source, syntax, className, style} = props;
    const lines = useMemo(() => source?.split('\n') ?? [], [source]);
    const renderLine = renderLineWith(props);

    return (
        <table className={className ? `source ${className}` : 'source'} style={style}>
            <tbody>
                {syntax ? syntax.reduce(renderLine, []) : lines.reduce(renderLine, [])}
            </tbody>
        </table>
    );
};
