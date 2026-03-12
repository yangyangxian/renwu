import { Card } from '@/components/ui-kit/Card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui-kit/Chart';
import { PieChart, Pie, Sector, type PieLabelRenderProps, type PieSectorShapeProps } from 'recharts';
import { Label } from '@/components/ui-kit/Label';

type PieDatum = RadioChartCardDatum & { name: string; fill: string };

function renderPieSector(props: PieSectorShapeProps) {
	return <Sector {...props} stroke="none" />;
}

function renderPieLabel(props: PieLabelRenderProps) {
	const { cx, cy, midAngle, outerRadius, payload, value } = props;

	if (cx == null || cy == null || midAngle == null || outerRadius == null) {
		return null;
	}

	const datum = payload as Partial<RadioChartCardDatum> | undefined;
	if (!datum?.label) {
		return null;
	}

	const radius = Number(outerRadius) + 26;
	const rawX = Number(cx) + radius * Math.cos((-midAngle * Math.PI) / 180);
	const y = Number(cy) + radius * Math.sin((-midAngle * Math.PI) / 180);
	const textAnchor = rawX > Number(cx) ? 'start' : 'end';
	const x = rawX + (textAnchor === 'start' ? 10 : -10);
	const displayValue = typeof value === 'number' ? value : Number(datum.value ?? 0);

	return (
		<text x={x} y={y} fill="currentColor" textAnchor={textAnchor} dominantBaseline="central">
			<tspan className="fill-foreground text-[14px] font-semibold">{datum.label}</tspan>
			<tspan dx="6" className="fill-muted-foreground text-[13px]">{displayValue}</tspan>
		</text>
	);
}

export interface RadioChartCardDatum {
  key: string;
  value: number;
  label: string;
  color: string; // hex or rgb for chart
  dotClass?: string; // Tailwind class for summary dot
}

export interface RadioChartCardProps {
  data: RadioChartCardDatum[];
  className?: string;
}

export function RadioChartCard({ data, className }: RadioChartCardProps) {
  const safeData = Array.isArray(data) ? data : [];
	const visibleData = safeData.filter(entry => entry.value > 0);
  const allZero = safeData.length > 0 && safeData.every(entry => entry.value === 0);
  const total = safeData.reduce((sum, d) => sum + d.value, 0);

  // If all values are zero, show a single gray segment in the chart
	const pieData: PieDatum[] = allZero
	? [{ key: 'empty', name: 'empty', value: 1, label: 'No Data', color: '#d1d5db', fill: '#d1d5db' }]
	: visibleData.map(entry => ({ ...entry, name: entry.key, fill: entry.color }));

  return (
	<Card className={`w-full flex flex-col ${className ? ` ${className}` : ''}`}>
	  <div className="w-full flex items-center justify-between">
		<span className="font-bold text-md">Task Status</span>
	  </div>
	  <ChartContainer
		config={Object.fromEntries(
		  pieData.map(entry => [entry.key, { label: entry.label, color: entry.color }])
		)}
		className="my-2 w-full flex flex-col items-center overflow-visible"
	  >
		<PieChart>
			<Pie
			data={pieData}
			dataKey="value"
			nameKey="name"
			cx="50%"
			cy="50%"
			innerRadius={48}
			outerRadius={70}
			paddingAngle={2}
			stroke="none"
			shape={renderPieSector}
			label={renderPieLabel}
			labelLine={!allZero}
			animationDuration={800}
			animationBegin={0}
			>
			</Pie>
			<ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
		</PieChart>
	  </ChartContainer>
	  {/* Data summary below the chart, matching the layout style */}
	  <div className="w-full divide-y divide-border flex flex-col justify-center">
		{safeData.map(entry => {
		  const percent = total === 0 ? '0' : ((entry.value / total) * 100).toFixed(0);
		  return (
			<div
			  key={entry.key}
			  className="flex items-center py-1 text-sm w-full"
			>
			  <div className="flex items-center gap-2 w-1/3">
				<span
				  className={`inline-block w-3 h-3 rounded-sm ${entry.dotClass ?? ''}`}
				/>
				<Label className="font-medium">
				  {entry.label}
				</Label>
			  </div>
			  <Label className="tabular-nums text-primary text-[1rem] w-1/3 justify-end pr-6">
				{entry.value}
			  </Label>
			  <Label className="tabular-nums text-primary ml-auto">
				{percent}%
			  </Label>
			</div>
		  );
		})}
	  </div>
	</Card>
  );
}
