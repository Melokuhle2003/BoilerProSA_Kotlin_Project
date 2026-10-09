package za.co.boilerpro.sa.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import za.co.boilerpro.sa.R

@Composable
fun SteelProfileReferenceScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            "Steel Profiles: Back Mark & Cross Centre",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            "Reference poster for channel (C-section) back marks, equal/unequal angle iron back marks, and I-beam/H-beam cross-centre measurements."
        )
        Card {
            Image(
                painter = painterResource(R.drawable.boilermaking_reference_tables),
                contentDescription = "Boilermaking reference tables for channel back mark, angle iron back mark, and I-beam and H-beam cross centre",
                modifier = Modifier.fillMaxWidth()
            )
        }
        Card {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Workshop reminder", fontWeight = FontWeight.Bold)
                Text(
                    "The poster values are typical training references and are not independently verified manufacturer data. Confirm the actual profile, datum, hole layout, drawing and job specification before marking or cutting."
                )
            }
        }
    }
}
