import { Card } from '@/components/ui-kit/Card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui-kit/Chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui-kit/Label';

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
  const allZero = safeData.length > 0 && safeData.every(entry => entry.value === 0);
  const total = safeData.reduce((sum, d) => sum + d.value, 0);

  // If all values are zero, show a single gray segment in the chart
  const pieData = allZero
	? [{ key: 'empty', value: 1, label: 'No Data', color: '#d1d5db' }]
	: safeData;

  return (
	<Card className={`w-full shadow-md p-4 pb-3 flex flex-col min-w-80 ${className ? ` ${className}` : ''}`}>
	  <div className="w-full flex items-center justify-between">
		<span className="font-semibold text-md">Task Status</span>
	  </div>
	  <ChartContainer
		config={Object.fromEntries(
		  pieData.map(entry => [entry.key, { label: entry.label, color: entry.color }])
		)}
		className="min-h-[200px] w-full flex flex-col items-center"
	  >
	<ResponsiveContainer>
	  <PieChart>
		<Pie
		  data={pieData}
		  dataKey="value"
		  nameKey="key"
		  cx="50%"
		  cy="50%"
		  innerRadius={48}
		  outerRadius={70}
		  paddingAngle={2}
		  stroke="none"
		  animationDuration={800}
          animationBegin={0}
		>
		  {pieData.map(entry => (
			<Cell
			  key={entry.key}
			  fill={entry.color}
			/>
		  ))}
		</Pie>
		<ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
	  </PieChart>
	</ResponsiveContainer>
	  </ChartContainer>
	  {/* Data summary below the chart, matching the layout style */}
	  <div className="w-full divide-y divide-border min-h-[120px] flex flex-col justify-center">
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
			  <Label className="tabular-nums text-primary text-[1rem] w-1/3 justify-end pr-5">
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
