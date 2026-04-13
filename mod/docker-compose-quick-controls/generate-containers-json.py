#!/usr/bin/env python3
import json
import subprocess
import datetime
import re

DOCKER_PS_FORMAT = '{{json .}}'
DOCKER_STATS_FORMAT = '{{json .}}'


def run(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or 'docker command failed')
    return result.stdout.strip()


def parse_json_lines(text):
    results = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            results.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return results


def parse_mem_value(value):
    if not value:
        return None
    match = re.match(r'([0-9.]+)\s*([KMGT]?i?)B', value, re.IGNORECASE)
    if not match:
        return None
    number = float(match.group(1))
    unit = match.group(2).upper()
    factor = 1
    if unit.startswith('K'):
        factor = 1024
    elif unit.startswith('M'):
        factor = 1024 ** 2
    elif unit.startswith('G'):
        factor = 1024 ** 3
    elif unit.startswith('T'):
        factor = 1024 ** 4
    return number * factor


def parse_cpu_value(value):
    if not value:
        return None
    try:
        return float(value.strip().rstrip('%'))
    except ValueError:
        return None


def parse_stat_usage(value):
    parts = value.split('/')
    if len(parts) != 2:
        return None, None
    used = parse_mem_value(parts[0].strip())
    limit = parse_mem_value(parts[1].strip())
    return used, limit


def normalize_labels(label_text):
    labels = {}
    for item in label_text.split(','):
        item = item.strip()
        if '=' not in item:
            continue
        key, value = item.split('=', 1)
        labels[key.strip()] = value.strip()
    return labels


def main():
    ps_output = run(f'docker ps --format "{DOCKER_PS_FORMAT}"')
    stats_output = run(f'docker stats --no-stream --format "{DOCKER_STATS_FORMAT}"')

    stats_by_id = {}
    for stat in parse_json_lines(stats_output):
        stats_by_id[stat.get('Container')] = stat

    containers = []
    for item in parse_json_lines(ps_output):
        container_id = item.get('ID') or item.get('Id')
        labels = normalize_labels(item.get('Labels') or '')
        service = labels.get('com.docker.compose.service') or item.get('Names')
        project = labels.get('com.docker.compose.project')
        running_status = item.get('Status') or item.get('State') or ''
        stats = stats_by_id.get(container_id, {})

        mem_used, mem_limit = parse_stat_usage(stats.get('MemUsage') or '')
        cpu = parse_cpu_value(stats.get('CPUPerc') or '')

        containers.append({
            'id': container_id,
            'name': item.get('Names'),
            'service': service,
            'image': item.get('Image'),
            'state': running_status,
            'status': running_status,
            'cpu': cpu,
            'memory': mem_used / 1024 / 1024 if mem_used is not None else None,
            'memory_limit': mem_limit / 1024 / 1024 if mem_limit is not None else None,
            'project': project,
            'compose_project': project,
            'restart_command': f'docker compose restart {service}',
            'stop_command': f'docker compose stop {service}',
        })

    payload = {
        'generated_at': datetime.datetime.utcnow().isoformat() + 'Z',
        'containers': containers,
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
