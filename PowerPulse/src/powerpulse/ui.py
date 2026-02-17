from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align
from rich.console import Group
from collections import deque
from .monitor import BatteryInfo, CpuInfo, ProcessInfo
from typing import List

class Dashboard:
    def __init__(self):
        self.layout = Layout()
        self.cpu_history = deque(maxlen=60)  # Keep last 60 ticks
        self._init_layout()

    def _init_layout(self):
        self.layout.split_column(
            Layout(name="header", size=3),
            Layout(name="upper", size=10),
            Layout(name="lower")
        )
        self.layout["upper"].split_row(
            Layout(name="sys_info"),
            Layout(name="cpu_graph")
        )
        self.layout["lower"].update(Panel("Waiting for data...", title="Top Processes"))

    def _generate_sparkline(self, data: List[float]) -> str:
        if not data:
            return ""
        
        bars = u" ▂▃▄▅▆▇█"
        graph = ""
        for value in data:
            # Assume value is 0-100
            index = int((value / 100) * (len(bars) - 1))
            index = max(0, min(index, len(bars) - 1))
            graph += bars[index]
        return graph

    def update(self, battery: BatteryInfo, cpu: CpuInfo, processes: List[ProcessInfo]):
        self.cpu_history.append(cpu.usage_percent)
        
        # Header
        title = Text("⚡ PowerPulse System Monitor ⚡", style="bold green", justify="center")
        self.layout["header"].update(Panel(title))

        # System Info Panel
        batt_icon = "🔌" if battery.power_plugged else "🔋"
        batt_color = "green" if battery.percent > 20 else "red"
        
        power_str = f"{battery.power_watts:.2f}W" if battery.power_watts is not None else "N/A"
        time_left = f"{battery.secsleft // 60}m" if battery.secsleft else "Calculating..."
        
        sys_info_text = Text()
        sys_info_text.append(f"{batt_icon} Battery: ", style="bold")
        sys_info_text.append(f"{battery.percent:.1f}% ", style=batt_color)
        sys_info_text.append(f"({battery.status})\n")
        sys_info_text.append(f"⚡ Discharge: {power_str}\n")
        sys_info_text.append(f"⏳ Time Left: {time_left}\n\n")
        sys_info_text.append(f"💻 CPU Freq: {cpu.frequency_current:.1f}MHz\n")
        sys_info_text.append(f"🔄 Cores: {cpu.core_count}")
        
        self.layout["sys_info"].update(Panel(sys_info_text, title="System Metrics"))

        # CPU Graph Panel
        sparkline = self._generate_sparkline(list(self.cpu_history))
        graph_panel_content = Align.center(
            Group(
                Text(f"Current Usage: {cpu.usage_percent}%", style="bold yellow"),
                Text(sparkline, style="blue")
            ),
            vertical="middle"
        )
        self.layout["cpu_graph"].update(Panel(graph_panel_content, title="CPU History (60s)"))

        # Process Table
        table = Table(expand=True)
        table.add_column("PID", style="cyan", no_wrap=True)
        table.add_column("Name", style="magenta")
        table.add_column("CPU %", justify="right", style="green")
        table.add_column("Mem %", justify="right", style="yellow")
        table.add_column("Power Score", justify="right", style="bold red")

        for proc in processes:
            table.add_row(
                str(proc.pid),
                proc.name,
                f"{proc.cpu_percent:.1f}",
                f"{proc.memory_percent:.1f}",
                f"{proc.power_score:.1f}"
            )
        
        self.layout["lower"].update(Panel(table, title="Top Power Consumers"))

    def get_layout(self) -> Layout:
        return self.layout
