"""
Meta Marketing API - Metrics Exporter
Extrae métricas de rendimiento de Meta Ads y las exporta a JSON para el dashboard
"""

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adsinsights import AdsInsights

# Cargar variables de entorno
load_dotenv()

class MetaMetricsExporter:
    def __init__(self):
        self.access_token = os.getenv('META_ACCESS_TOKEN')
        self.ad_account_id = os.getenv('META_AD_ACCOUNT_ID')

        if not self.access_token or not self.ad_account_id:
            raise ValueError("META_ACCESS_TOKEN y META_AD_ACCOUNT_ID deben estar configurados en .env")

        # Inicializar API
        FacebookAdsApi.init(access_token=self.access_token)
        self.account = AdAccount(self.ad_account_id)

    def get_date_range(self, days=30):
        """Genera rango de fechas para últimos N días"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        return {
            'since': start_date.strftime('%Y-%m-%d'),
            'until': end_date.strftime('%Y-%m-%d')
        }

    def get_aggregated_metrics(self, date_range=None):
        """
        Obtiene métricas agregadas del account
        """
        if not date_range:
            date_range = self.get_date_range(30)

        # Campos de métricas que queremos obtener
        fields = [
            AdsInsights.Field.impressions,
            AdsInsights.Field.clicks,
            AdsInsights.Field.spend,
            AdsInsights.Field.cpc,
            AdsInsights.Field.cpm,
            AdsInsights.Field.ctr,
            AdsInsights.Field.reach,
            AdsInsights.Field.frequency,
            # Conversiones
            'conversions',
            'cost_per_conversion',
            # Engagement
            'actions',  # likes, comments, shares, etc.
            # Objetivos
            'cost_per_action_type',
        ]

        params = {
            'time_range': date_range,
            'level': 'account',
        }

        try:
            insights = self.account.get_insights(
                fields=fields,
                params=params
            )

            if insights:
                data = insights[0]

                # Procesar acciones (conversiones, engagement)
                actions = data.get('actions', [])
                conversions = sum(int(action.get('value', 0)) for action in actions
                                if 'conversion' in action.get('action_type', '').lower())

                # Procesar engagement
                engagement_actions = ['like', 'comment', 'share', 'post_engagement']
                engagement = sum(int(action.get('value', 0)) for action in actions
                               if any(eng in action.get('action_type', '').lower()
                                     for eng in engagement_actions))

                # Métricas agregadas
                metrics = {
                    'impressions': int(data.get('impressions', 0)),
                    'clicks': int(data.get('clicks', 0)),
                    'spend': float(data.get('spend', 0)),
                    'cpc': float(data.get('cpc', 0)),
                    'cpm': float(data.get('cpm', 0)),
                    'ctr': float(data.get('ctr', 0)),
                    'reach': int(data.get('reach', 0)),
                    'frequency': float(data.get('frequency', 0)),
                    'conversions': conversions,
                    'engagement': engagement,
                    'cost_per_conversion': float(data.get('cost_per_conversion', [{}])[0].get('value', 0)) if conversions > 0 else 0,
                    'conversion_rate': (conversions / int(data.get('clicks', 1))) * 100 if int(data.get('clicks', 0)) > 0 else 0,
                }

                return metrics

            return self._empty_metrics()

        except Exception as e:
            print(f"Error obteniendo métricas agregadas: {str(e)}")
            return self._empty_metrics()

    def get_time_series(self, date_range=None, breakdown='day'):
        """
        Obtiene serie de tiempo de métricas diarias
        """
        if not date_range:
            date_range = self.get_date_range(30)

        fields = [
            AdsInsights.Field.impressions,
            AdsInsights.Field.clicks,
            AdsInsights.Field.spend,
            AdsInsights.Field.cpc,
            AdsInsights.Field.ctr,
            'conversions',
        ]

        params = {
            'time_range': date_range,
            'time_increment': 1,  # Por día
            'level': 'account',
        }

        try:
            insights = self.account.get_insights(
                fields=fields,
                params=params
            )

            time_series = []
            for insight in insights:
                # Procesar conversiones
                actions = insight.get('actions', [])
                conversions = sum(int(action.get('value', 0)) for action in actions
                                if 'conversion' in action.get('action_type', '').lower())

                time_series.append({
                    'date': insight.get('date_start'),
                    'impressions': int(insight.get('impressions', 0)),
                    'clicks': int(insight.get('clicks', 0)),
                    'spend': float(insight.get('spend', 0)),
                    'cpc': float(insight.get('cpc', 0)),
                    'ctr': float(insight.get('ctr', 0)),
                    'conversions': conversions,
                })

            return sorted(time_series, key=lambda x: x['date'])

        except Exception as e:
            print(f"Error obteniendo serie de tiempo: {str(e)}")
            return []

    def get_campaigns_metrics(self, date_range=None):
        """
        Obtiene métricas por campaña
        """
        if not date_range:
            date_range = self.get_date_range(30)

        fields = [
            Campaign.Field.name,
            Campaign.Field.status,
            Campaign.Field.objective,
        ]

        try:
            campaigns = self.account.get_campaigns(fields=fields)

            campaigns_data = []
            for campaign in campaigns:
                # Obtener insights de la campaña
                insights_fields = [
                    AdsInsights.Field.impressions,
                    AdsInsights.Field.clicks,
                    AdsInsights.Field.spend,
                    AdsInsights.Field.cpc,
                    AdsInsights.Field.ctr,
                    'conversions',
                ]

                params = {
                    'time_range': date_range,
                    'level': 'campaign',
                }

                try:
                    campaign_insights = campaign.get_insights(
                        fields=insights_fields,
                        params=params
                    )

                    if campaign_insights:
                        insight = campaign_insights[0]

                        # Procesar conversiones
                        actions = insight.get('actions', [])
                        conversions = sum(int(action.get('value', 0)) for action in actions
                                        if 'conversion' in action.get('action_type', '').lower())

                        clicks = int(insight.get('clicks', 0))

                        campaigns_data.append({
                            'id': campaign.get('id'),
                            'name': campaign.get('name'),
                            'status': campaign.get('status'),
                            'objective': campaign.get('objective'),
                            'impressions': int(insight.get('impressions', 0)),
                            'clicks': clicks,
                            'spend': float(insight.get('spend', 0)),
                            'cpc': float(insight.get('cpc', 0)),
                            'ctr': float(insight.get('ctr', 0)),
                            'conversions': conversions,
                            'conversion_rate': (conversions / clicks * 100) if clicks > 0 else 0,
                        })

                except Exception as e:
                    print(f"Error obteniendo insights de campaña {campaign.get('name')}: {str(e)}")
                    continue

            # Ordenar por gasto (mayor a menor)
            return sorted(campaigns_data, key=lambda x: x['spend'], reverse=True)

        except Exception as e:
            print(f"Error obteniendo campañas: {str(e)}")
            return []

    def get_audience_demographics(self, date_range=None):
        """
        Obtiene datos demográficos de la audiencia
        """
        if not date_range:
            date_range = self.get_date_range(30)

        fields = [
            AdsInsights.Field.impressions,
            AdsInsights.Field.clicks,
            AdsInsights.Field.spend,
        ]

        demographics = {
            'age_gender': [],
            'countries': [],
            'devices': [],
        }

        try:
            # Por edad y género
            params_age_gender = {
                'time_range': date_range,
                'level': 'account',
                'breakdowns': ['age', 'gender'],
            }

            insights_age_gender = self.account.get_insights(
                fields=fields,
                params=params_age_gender
            )

            for insight in insights_age_gender:
                demographics['age_gender'].append({
                    'age': insight.get('age'),
                    'gender': insight.get('gender'),
                    'impressions': int(insight.get('impressions', 0)),
                    'clicks': int(insight.get('clicks', 0)),
                    'spend': float(insight.get('spend', 0)),
                })

            # Por país
            params_country = {
                'time_range': date_range,
                'level': 'account',
                'breakdowns': ['country'],
            }

            insights_country = self.account.get_insights(
                fields=fields,
                params=params_country
            )

            for insight in insights_country:
                demographics['countries'].append({
                    'country': insight.get('country'),
                    'impressions': int(insight.get('impressions', 0)),
                    'clicks': int(insight.get('clicks', 0)),
                    'spend': float(insight.get('spend', 0)),
                })

            # Ordenar países por gasto
            demographics['countries'] = sorted(demographics['countries'],
                                             key=lambda x: x['spend'],
                                             reverse=True)[:10]  # Top 10

            # Por dispositivo
            params_device = {
                'time_range': date_range,
                'level': 'account',
                'breakdowns': ['device_platform'],
            }

            insights_device = self.account.get_insights(
                fields=fields,
                params=params_device
            )

            for insight in insights_device:
                demographics['devices'].append({
                    'device': insight.get('device_platform'),
                    'impressions': int(insight.get('impressions', 0)),
                    'clicks': int(insight.get('clicks', 0)),
                    'spend': float(insight.get('spend', 0)),
                })

        except Exception as e:
            print(f"Error obteniendo demografía: {str(e)}")

        return demographics

    def _empty_metrics(self):
        """Retorna métricas vacías"""
        return {
            'impressions': 0,
            'clicks': 0,
            'spend': 0.0,
            'cpc': 0.0,
            'cpm': 0.0,
            'ctr': 0.0,
            'reach': 0,
            'frequency': 0.0,
            'conversions': 0,
            'engagement': 0,
            'cost_per_conversion': 0.0,
            'conversion_rate': 0.0,
        }

    def export_all_metrics(self, days=30, output_file='dashboard/data/metrics.json'):
        """
        Exporta todas las métricas a un archivo JSON
        """
        print(f"Exportando métricas de los últimos {days} días...")

        date_range = self.get_date_range(days)

        # Recopilar todas las métricas
        data = {
            'generated_at': datetime.now().isoformat(),
            'date_range': date_range,
            'aggregated': self.get_aggregated_metrics(date_range),
            'time_series': self.get_time_series(date_range),
            'campaigns': self.get_campaigns_metrics(date_range),
            'demographics': self.get_audience_demographics(date_range),
        }

        # Crear directorio si no existe
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # Guardar a JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"✅ Métricas exportadas a: {output_file}")
        print(f"   - Período: {date_range['since']} a {date_range['until']}")
        print(f"   - Gasto total: ${data['aggregated']['spend']:.2f}")
        print(f"   - Clicks totales: {data['aggregated']['clicks']:,}")
        print(f"   - Conversiones: {data['aggregated']['conversions']}")
        print(f"   - Campañas: {len(data['campaigns'])}")

        return data


def main():
    """Función principal"""
    try:
        exporter = MetaMetricsExporter()

        # Exportar métricas de los últimos 30 días por defecto
        exporter.export_all_metrics(days=30)

        # También exportar de los últimos 7 días para comparación
        exporter.export_all_metrics(days=7, output_file='dashboard/data/metrics_7d.json')

        # Y de los últimos 90 días
        exporter.export_all_metrics(days=90, output_file='dashboard/data/metrics_90d.json')

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
